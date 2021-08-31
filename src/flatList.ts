import { sortBy } from 'lodash';
import { Item, SearchOptions } from './common';

class FlatList<T> {
  public list: Item<T>[] = [];
  public sorted: boolean = false;

  constructor() {}

  validateInvariants(): void {
    if (process.env.NODE_ENV === 'production') return;
    return;
  }

  add(item: Item<T>) {
    this.list.push(item);
    this.sorted = false;
  }

  remove(target: Pick<Item<never>, 'key' | 'distinct'>) {
    this.list = this.list.filter(
      item => item.key !== target.key || item.distinct !== target.distinct
    );
  }

  unsortedPrefixSearch(prefix: string, opts?: Partial<SearchOptions>): T[] {
    const options: SearchOptions = {
      unique: opts?.unique ?? false,
      limit: opts?.limit ?? Number.POSITIVE_INFINITY,
    };

    const results = sortBy(
      this.list.filter(item => item.key.startsWith(prefix)),
      item => item.score
    );
    const seenKeys = new Set<string>();
    const out: T[] = [];
    for (const item of results) {
      if (options.unique && seenKeys.has(item.key)) continue;
      seenKeys.add(item.key);
      out.push(item.value);
      if (out.length >= options.limit) break;
    }

    return out;
  }

  sort(): void {
    if (this.sorted) return;
    this.list = sortBy(this.list, item => item.score);
    this.sorted = true;
  }

  sortedPrefixSearch(prefix: string, opts?: Partial<SearchOptions>): T[] {
    if (!this.sorted)
      throw new Error('The list must be sorted in order to use this');
    const options: SearchOptions = {
      unique: opts?.unique ?? false,
      limit: opts?.limit ?? Number.POSITIVE_INFINITY,
    };

    const seenKeys = new Set<string>();
    const out: T[] = [];
    for (const item of this.list) {
      if (options.unique && seenKeys.has(item.key)) continue;
      if (!item.key.startsWith(prefix)) continue;
      seenKeys.add(item.key);
      out.push(item.value);
      if (out.length >= options.limit) break;
    }

    return out;
  }

  sortedSubstringSearch(str: string, opts?: Partial<SearchOptions>): T[] {
    if (!this.sorted)
      throw new Error('The list must be sorted in order to use this');
    const options: SearchOptions = {
      unique: opts?.unique ?? false,
      limit: opts?.limit ?? Number.POSITIVE_INFINITY,
    };

    const seenKeys = new Set<string>();
    const out: T[] = [];
    for (const item of this.list) {
      if (options.unique && seenKeys.has(item.key)) continue;
      if (!item.key.includes(str)) continue;
      seenKeys.add(item.key);
      out.push(item.value);
      if (out.length >= options.limit) break;
    }

    return out;
  }
}

export { FlatList as default, Item };
