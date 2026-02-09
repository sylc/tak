// Timers are stored in 3 ways in deno kv. They are stored:
// - under the timers namespace eg: ["timers", timerId, { ... }: Timer ]
// - in an index sorted by start time eg: [`${timer.start}__${timer.id}`, timer.id]
// - referenced by the projects namespace eg: ["projects", timer.projectId, "timers", timer.id, true]

import { addDays } from "date-fns/addDays";
import { getTimersValuesInBatches } from "./utils_db.ts";
import { endOfWeek } from "date-fns/endOfWeek";
import { Timer } from "../client/src/types.ts";
import { sliceIntoBatches } from "./utils.ts";

export class TimersAdaptor {
  #kv: Deno.Kv;

  static index_timers_by_start_date = "timers_by_start_date";
  static compositeKeyStart = (timer: { start: string; id: string }) => {
    return `${timer.start}__${timer.id}`;
  };

  constructor(kv: Deno.Kv) {
    this.#kv = kv;
  }

  // Create a new Entry
  createNewTimer = async (timer: Timer, clearActiveTimer?: boolean) => {
    const save = this.#kv.atomic()
      .set(["timers", timer.id], timer)
      .set(
        [
          TimersAdaptor.index_timers_by_start_date,
          TimersAdaptor.compositeKeyStart({
            start: timer.start,
            id: timer.id,
          }),
        ],
        timer.id,
      );
    if (clearActiveTimer) save.set(["activeTimer"], null);
    await save.commit();
  };

  // get the last timers
  // limited to the last 5000.
  timers = async (opts?: { startOfWeekDay: string }) => {
    const start = [
      TimersAdaptor.index_timers_by_start_date,
      (addDays(new Date(), -21)).toISOString(),
    ];
    const end = [TimersAdaptor.index_timers_by_start_date, "5000"];

    if (opts?.startOfWeekDay) {
      // get the startDate of the week.
      start[1] = opts?.startOfWeekDay;
      // get the endDate of teh week
      end[1] = endOfWeek(new Date(opts?.startOfWeekDay), { weekStartsOn: 1 })
        .toISOString();
    }

    const timerIds = await Array.fromAsync(
      this.#kv.list<string>({ start, end }, { reverse: true }),
    );

    return await getTimersValuesInBatches(this.#kv, timerIds);
  };

  delete = async (timerId: string) => {
    const timer = (await this.#kv.get<Timer>(["timers", timerId])).value!;
    if (timer.projectId) {
      console.log("removing from project", timer.projectId);
      await this.#kv.delete(["projects", timer.projectId, "timers", timer.id]);
    }
    await this.#kv.atomic()
      .delete(["timers", timerId])
      .delete(
        [
          TimersAdaptor.index_timers_by_start_date,
          TimersAdaptor.compositeKeyStart(timer),
        ],
      ).commit();
  };

  updateTimerName = async (timerId: string, newName: string) => {
    const timer = (await this.#kv.get<Timer>(["timers", timerId])).value!;
    await this.#kv.set(["timers", timerId], { ...timer, name: newName });
  };

  setProject = async (timerId: string, projectId: string) => {
    const timer = (await this.#kv.get<Timer>(["timers", timerId])).value!;
    const oldProjectId = timer.projectId || "NO_PROJECT";
    await this.#kv.atomic()
      .set(["timers", timerId], { ...timer, projectId })
      .delete(["projects", oldProjectId, "timers", timerId])
      .set(["projects", projectId, "timers", timerId], true) // Note that true used to be the timer details. but this was duplicating data, so reverted to true.
      .commit();
  };

  // set the start and stop of a timer
  setTimerRange = async (timerId: string, start: string, stop: string) => {
    const timer = (await this.#kv.get<Timer>(["timers", timerId])).value!;
    const timerUpdated = { ...timer, start, stop };
    await this.#kv.atomic()
      .set(["timers", timerId], timerUpdated)
      .commit();

    // updating index
    if (timer.start !== start) {
      await this.#kv.atomic()
        .delete([
          TimersAdaptor.index_timers_by_start_date,
          TimersAdaptor.compositeKeyStart(timer),
        ])
        .set(
          [
            TimersAdaptor.index_timers_by_start_date,
            TimersAdaptor.compositeKeyStart(timerUpdated),
          ],
          timerId,
        )
        .commit();
    }
  };

  getTimersValuesInBatches = async (
    timerIds: (Deno.KvEntry<string> | string)[],
  ) => {
    const timersBatches = sliceIntoBatches(timerIds, 8);
    let entries: Deno.KvEntryMaybe<Timer>[] = [];
    for (const batch of timersBatches) {
      entries = entries.concat(
        await this.#kv.getMany<Timer[]>(
          batch.map((
            item,
          ) => ["timers", typeof item === "string" ? item : item.value]),
        ),
      );
    }

    const timers: Timer[] = [];
    for (const entry of entries) {
      entry.value && timers.push(entry.value);
    }
    return timers;
  };
}
