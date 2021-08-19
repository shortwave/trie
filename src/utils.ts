/**
 * Remove all elements from `arr` that don't match `predicate`.
 */
export function filterInPlace<T>(
  arr: T[],
  predicate: (item: T) => boolean
): void {
  let j = 0;
  for (let i = 0; i < arr.length; ++i) {
    const item = arr[i];
    if (predicate(item)) {
      arr[j] = item;
      ++j;
    }
  }
  arr.splice(j, arr.length - j);
}
