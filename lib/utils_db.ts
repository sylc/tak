import { Timer } from "../client/src/types.ts";
import { sliceIntoBatches } from "./utils.ts";

export async function getTimersValuesInBatches(
  kv: Deno.Kv,
  timerIds: (Deno.KvEntry<string> | string)[],
) {
  const timersBatches = sliceIntoBatches(timerIds, 8);
  let entries: Deno.KvEntryMaybe<Timer>[] = [];
  for (const batch of timersBatches) {
    entries = entries.concat(
      await kv.getMany<Timer[]>(
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
}
