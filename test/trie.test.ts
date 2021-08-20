import Trie, { SearchOptions, Item } from '../src/index';

/** A trie that strictly validates it's invariants after every operation. */
class StrictTrie<T> extends Trie<T> {
  add(item: Item<T>) {
    super.add(item);
    this.validateInvariants();
  }

  remove(key: string) {
    super.remove(key);
    this.validateInvariants();
  }

  prefixSearch(prefix: string, opts?: Partial<SearchOptions>): T[] {
    const result = super.prefixSearch(prefix, opts);
    this.validateInvariants();
    return result;
  }
}

describe('Trie', () => {
  it('should allow value retrieval', () => {
    const t = new StrictTrie();

    const item = {
      key: 'one',
      value: 1,
      score: 1,
    };

    t.add(item);

    expect(t.prefixSearch('o')).toEqual([1]);
    expect(t.prefixSearch('on')).toEqual([1]);
    expect(t.prefixSearch('one')).toEqual([1]);
  });

  it('should sort values by score', () => {
    const aaa = {
      key: 'aaa',
      value: 2,
      score: 2,
    };
    const aaa2 = {
      key: 'aaa',
      value: 4,
      score: 4,
    };
    const aab = {
      key: 'aab',
      value: 3,
      score: 3,
    };
    const abb = {
      key: 'abb',
      value: 1,
      score: 1,
    };

    const t = new StrictTrie();

    t.add(aaa);
    t.add(aab);
    t.add(abb);
    t.add(aaa2);

    expect(t.prefixSearch('a')).toEqual([4, 3, 2, 1]);
  });

  it('should be able to find a limited set of results', () => {
    const t = new StrictTrie();

    t.add({
      key: 'aaa',
      value: 4,
      score: 4,
    });

    t.add({
      key: 'aaa',
      value: 3,
      score: 3,
    });

    t.add({
      key: 'aab',
      value: 2,
      score: 2,
    });

    t.add({
      key: 'abb',
      value: 1,
      score: 1,
    });

    expect(t.prefixSearch('a', { limit: 3, unique: true })).toEqual([4, 2, 1]);
    expect(t.prefixSearch('a', { limit: 3, unique: false })).toEqual([4, 3, 2]);
  });

  it('should return an empty array if nothing is found', () => {
    expect(new StrictTrie().prefixSearch('a')).toEqual([]);

    const t = new StrictTrie();
    t.add({
      key: 'gaa',
      value: 2,
      score: 2,
    });

    expect(t.prefixSearch('gb')).toEqual([]);
  });

  it('should return the highest scoring match of duplicates', () => {
    const t = new StrictTrie();
    t.add({
      key: 'abc',
      value: 2,
      score: 2,
    });

    t.add({
      key: 'abc',
      value: 4,
      score: 4,
    });

    expect(t.prefixSearch('abc', { limit: 1 })).toEqual([4]);
  });

  it('should be able to prefix match with tails', () => {
    const t = new StrictTrie();
    t.add({
      key: 'sarah',
      value: 1,
      score: 1,
    });

    t.add({
      key: 'shashi',
      value: 2,
      score: 2,
    });

    expect(t.prefixSearch('sha')).toEqual([2]);
  });

  it('should be able to unique even if multiple values have the same score', () => {
    const t = new StrictTrie();

    t.add({
      key: 'abc',
      value: 1,
      score: 1,
    });

    t.add({
      key: 'acc',
      value: 1,
      score: 1,
    });

    t.add({
      key: 'abb',
      value: 1,
      score: 1,
    });

    expect(t.prefixSearch('a', { unique: true })).toEqual([1, 1, 1]);
  });

  it('should be able to distinguish between distinct keys', () => {
    const t = new StrictTrie();

    t.add({
      key: 'aaa',
      distinct: 'b',
      score: 1,
      value: 1,
    });

    t.add({
      key: 'aaa',
      distinct: 'c',
      score: 2,
      value: 2,
    });

    expect(t.prefixSearch('a', { unique: true })).toEqual([2, 1]);
  });

  it('should be able to distinguish between distinct keys', () => {
    const t = new StrictTrie();

    t.add({
      key: 'aaa',
      distinct: 'b',
      score: 3,
      value: 3,
    });

    t.add({
      key: 'aaa',
      distinct: 'b',
      score: 2,
      value: 2,
    });

    t.add({
      key: 'aaa',
      distinct: 'c',
      score: 1,
      value: 1,
    });

    expect(t.prefixSearch('a', { unique: true, limit: 2 })).toEqual([3, 1]);
  });

  it('should work on prefixes', () => {
    const t = new StrictTrie({ maxWidth: 1 });

    t.add({
      key: 'a',
      score: 1,
      value: 1,
    });
    t.add({
      key: 'aa',
      score: 2,
      value: 2,
    });
    t.add({
      key: 'aaa',
      score: 3,
      value: 3,
    });

    expect(t.prefixSearch('a')).toEqual([3, 2, 1]);
    expect(t.prefixSearch('aa')).toEqual([3, 2]);
    expect(t.prefixSearch('aaa')).toEqual([3]);
  });

  it('can delete values', () => {
    const t = new StrictTrie();

    t.add({
      key: 'a',
      score: 2,
      value: 'a',
    });

    t.add({
      key: 'b',
      score: 1,
      value: 'b',
    });

    expect(t.prefixSearch('')).toEqual(['a', 'b']);
    t.remove('a');
    expect(t.prefixSearch('')).toEqual(['b']);
    expect(t.prefixSearch('b')).toEqual(['b']);
    expect(t.prefixSearch('a')).toEqual([]);
    t.remove('b');
    expect(t.prefixSearch('')).toEqual([]);
    expect(t.prefixSearch('b')).toEqual([]);
    expect(t.prefixSearch('a')).toEqual([]);
  });

  it('can replace values', () => {
    const t = new StrictTrie();

    t.add({
      key: 'a',
      score: 1,
      value: 'a',
    });

    t.add({
      key: 'b',
      score: 2,
      value: 'b',
    });

    expect(t.prefixSearch('')).toEqual(['b', 'a']);
    t.remove('a');
    expect(t.prefixSearch('')).toEqual(['b']);
    t.add({
      key: 'a',
      score: 3,
      value: 'a',
    });
    expect(t.prefixSearch('')).toEqual(['a', 'b']);
    t.remove('a');
  });
});
