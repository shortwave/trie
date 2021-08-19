import { filterInPlace } from '../src/utils';

describe('filter in place', () => {
  it('should remove values', () => {
    const arr = [1, 2, 3, 4, 5];
    filterInPlace(arr, i => i % 2 === 0);
    expect(arr).toEqual([2, 4]);
    filterInPlace(arr, i => i % 2 !== 0);
    expect(arr).toEqual([]);
  });
});
