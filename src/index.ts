import Node from './node';
import { Item, SearchOptions } from './common';
import { roughSizeOfObject } from './utils';

interface TrieOptions {
  readonly maxWidth: number;
}

/**
 * A Trie optimized for weighted autocompletion returning a small number
 * of results.
 *
 * It can take an optional ({maxWidth: X}) parameter. This parameter is
 * set relatively large because we care a lot about indexing time, and
 * lookup is so fast that slowing it down by a factor of 10 is still
 * fast enough for more most use-cases.
 *
 * NOTE: The factor only affects the first lookup for any given prefix,
 * after a trie mutation. After that the widthFactor is mostly irrelevant.
 */
class Trie<T> {
  private readonly maxWidth: number;
  private readonly root: Node<T> = new Node();

  constructor(options?: TrieOptions) {
    if (options && options.maxWidth) {
      this.maxWidth = options.maxWidth;
    } else {
      this.maxWidth = 500;
    }
  }

  validateInvariants(): void {
    if (process.env.NODE_ENV === 'production') return;
    this.root.validateInvariants('');
  }

  /**
   * Add a new item to the auto-completer.
   *
   * @param item The item to insert.
   */
  add(item: Item<T>) {
    this.root.add(item, 0, this.maxWidth);
  }

  /**
   * Remove all items with this key and distinct properties from the auto-completer.
   *
   * The key and distinct properties must both match exactly in order to remove an element from the trie.
   *
   * @param target the key and distinct to remove.
   */
  remove(target: Pick<Item<never>, 'key' | 'distinct'>) {
    this.root.remove(target, 0);
  }

  /**
   * Prefix search terms in the auto-completer.
   *
   * Returns an array of values that have keys starting with the prefix.
   *
   * You are encouraged to pass an options object with:
   * a .limit to limit the number of results returned.
   * a .unique property if you only want one result per-key.
   *
   * The limit is particularly important because the performance of the
   * algorithm is determined primarily by the limit.
   */
  prefixSearch(prefix: string, opts?: Partial<SearchOptions>): T[] {
    const results: T[] = [];
    const node = this.root.findPrefix(prefix, 0);

    if (!node) {
      return results;
    }

    const options: SearchOptions = {
      unique: opts?.unique ?? false,
      limit: opts?.limit ?? Number.POSITIVE_INFINITY,
    };

    node.getSortedResults(prefix, results, options);

    return results;
  }
}

export { Trie as default, Item, TrieOptions, SearchOptions, roughSizeOfObject };
