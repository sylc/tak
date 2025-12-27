export function keyBy<T>(array: T[], key: string): Record<string, T> {
  return array.reduce((obj, item) => {
    // @ts-expect-error // some error
    obj[item[key]] = item;
    return obj;
  }, {});
}
