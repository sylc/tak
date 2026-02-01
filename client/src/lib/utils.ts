import type { Timer } from "../types.ts";

export function keyBy<T>(array: T[], key: string): Record<string, T> {
  return array.reduce((obj, item) => {
    // @ts-expect-error // some error
    obj[item[key]] = item;
    return obj;
  }, {});
}

export function sumTimersDurations(timers: Timer[]) {
  return timers.reduce(
    (acc, cur) =>
      acc +
      (new Date(cur.stop).valueOf() - new Date(cur.start).valueOf()),
    0,
  );
}
