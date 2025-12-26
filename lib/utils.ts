export const index_timers_by_start_date = "timers_by_start_date";
export const compositeKeyStart = (timer: { start: string; id: string }) => {
  return `${timer.start}__${timer.id}`;
};
