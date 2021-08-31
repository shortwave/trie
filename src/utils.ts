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

function assertNever(x: never): never {
  throw new Error(`Unknown type for object: ${x}`);
}

export function roughSizeOfObject(obj: any) {
  const seenObjects = new Set<any>();
  const stack = [obj];
  let bytes = 0;

  while (stack.length > 0) {
    const value = stack.pop();

    const valueType = typeof value;
    switch (valueType) {
      case 'undefined':
        break;
      case 'function':
        // Not sure, zero I guess?
        break;
      case 'boolean':
        bytes += 4;
        break;
      case 'number':
        bytes += 8;
        break;
      case 'string':
        bytes += value.length * 2;
        break;
      case 'bigint':
        bytes += value.toString().length * 2;
        break;
      case 'symbol':
        bytes += 1; // Just for the reference?
        if (seenObjects.has(value)) break;
        seenObjects.add(value);
        bytes += (value.description?.length ?? 1) * 2;
        break;
      case 'object':
        bytes += 1; // Just for the reference?
        if (seenObjects.has(value)) break;
        seenObjects.add(value);
        for (const i in value) {
          stack.push(value[i]);
        }
        break;
      default:
        assertNever(valueType);
    }
  }
  return bytes;
}
