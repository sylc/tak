import { ulid } from "ulid";
import { addHours, subDays } from "date-fns";
import type { Timer } from "./client/src/types.ts";
import { compositeKeyStart, index_timers_by_start_date } from "./lib/utils.ts";

function createRandomTimer(
  startDate: Date,
  name: string,
): Timer {
  const id = ulid(startDate.getTime());
  const start = startDate.toISOString();
  const stop = addHours(startDate, Math.random() * 2 + 0.25).toISOString(); // random duration between 15min and 2.25 hours
  return {
    id,
    start,
    stop,
    name,
  };
}

async function seed() {
  console.log(
    "Seeding database with 10 task for today and 8 tasks for yesterday...",
  );
  const kv = await Deno.openKv("./.tak/db");
  const today = new Date();
  const yesterday = subDays(today, 1);

  const timersToCreate: Timer[] = [];

  // 10 tasks for today
  for (let i = 0; i < 10; i++) {
    const startDate = new Date(today.getTime() - i * 2.5 * 60 * 60 * 1000); // spread them out over the day
    timersToCreate.push(
      createRandomTimer(startDate, `Today's task ${i + 1}`),
    );
  }

  // 8 tasks for yesterday
  for (let i = 0; i < 8; i++) {
    const startDate = new Date(yesterday.getTime() - i * 2.5 * 60 * 60 * 1000); // spread them out
    timersToCreate.push(
      createRandomTimer(startDate, `Yesterday's task ${i + 1}`),
    );
  }

  const op = kv.atomic();

  for (const timer of timersToCreate) {
    op.set(["timers", timer.id], timer).set(
      [index_timers_by_start_date, compositeKeyStart(timer)],
      timer.id,
    );
  }

  await op.commit();

  console.log(`Seeded ${timersToCreate.length} timers into the database.`);
  kv.close();
}

if (import.meta.main) {
  await seed();
}
