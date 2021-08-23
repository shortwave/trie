import PQueue from './pqueue';
import { Item, SearchOptions } from './common';
import { filterInPlace } from './utils';

type Letter = string;

/**
 * A Node in the autocompleter Trie.
 */
class Node<T> {
  /**
   * The maximum score of all the values in this element
   * or its children.
   *
   * Visible for PQueue.
   */
  score = 0;

  /**
   *  The children of the trie indexed by letter.
   *
   *  This can also hold empty string children, which are children where the prefix above this node matches the key
   *  exactly.
   *
   * ```
   * {a: new Node(), b: new Node(), ...}
   * ```
   */
  private children: { [k: string]: Node<T> } = {};

  /**
   * Indicates whether the list of values is sorted.
   * Because building the tree takes a significant amount of
   * time, and we probably won't use most of it, the tree is
   * left unsorted until query time.
   *
   * This is an amortised cost, paid back in small doses over
   * the first few queries to the tree.
   */
  private sorted = true;
  /**
   * Both the children and values of the tree,
   * sorted by score.
   * We use one list for convenient sorting, but
   * it's kind of unhygenic.
   */
  private values: Array<Letter> | Array<Item<T>> = [];
  private leaf = true;

  validateInvariants(path: string): void {
    if (process.env.NODE_ENV === 'production') return;
    function assert(condition: unknown, msg: string = ''): asserts condition {
      if (!condition) throw new Error(msg);
    }
    if (this.leaf) {
      // We have no children
      assert(Object.keys(this.children).length === 0);
      // Our values are items
      let max = 0;
      for (const v of this.values) {
        assert(typeof v !== 'string');
        max = Math.max(v.score, max);
        assert(v.key.startsWith(path), `${v.key} does not start with ${path}`);
      }
      assert(max === this.score);
      const values = this.values as Array<Item<unknown>>;
      // If we're marked as sorted we're actually sorted descending.
      if (this.sorted && values.length > 0) {
        for (const { score } of values) {
          assert(score <= max);
          max = score;
        }
      }
    } else {
      let max = 0;
      for (const v of this.values) {
        assert(typeof v === 'string', `Expected string, got: ${v}`);
        assert(this.children[v]);
        this.children[v].validateInvariants(path + v);
        max = Math.max(this.children[v].score, max);
      }
      assert(this.score === max);
      const values = this.values as Array<Letter>;
      assert(values.length === Object.keys(this.children).length);
      // If we're marked as sorted we're actually sorted descending.
      if (this.sorted && values.length > 0) {
        for (const letter of values) {
          const { score } = this.children[letter];
          assert(score <= max);
          max = score;
        }
      }
    }
  }

  /* Add a new item to the node.
   *
   * The item has a .key, .score and .value, and the index indicates the position in
   * the key (i.e. the depth in the trie) that this node is responsible for.
   */
  add(item: Item<T>, index: number, maxWidth: number): void {
    if (item.score > this.score) {
      this.score = item.score;
    }

    if (this.leaf && index < item.key.length && this.values.length > maxWidth) {
      const oldValues = this.values as Array<Item<T>>;
      this.values = [] as Array<Letter>;
      this.leaf = false;
      for (let i = 0; i < oldValues.length; i++) {
        const item = oldValues[i];
        const chr = item.key[index] || '';

        let child = this.children[chr];
        if (!child) {
          child = new Node();
          this.children[chr] = child;
          this.values.push(chr);
        }
        child.add(item, index + 1, maxWidth);
      }
    }

    if (this.leaf) {
      (this.values as Array<Item<T>>).push(item);
    } else {
      const chr = item.key[index] || '';

      let child = this.children[chr];
      if (!child) {
        child = new Node();
        this.children[chr] = child;
        (this.values as Letter[]).push(chr);
      }
      child.add(item, index + 1, maxWidth);
    }

    this.sorted = false;
  }

  remove(key: string, index: number) {
    if (this.leaf) {
      let max = 0;
      filterInPlace(this.values as Item<T>[], item => {
        const keep = item.key !== key;
        if (keep) {
          max = Math.max(item.score, max);
        }
        return keep;
      });
      this.score = max;
      // We're still sorted by score
    } else {
      const chr = key[index] || '';
      const child = this.children[chr];
      if (!child) return;
      child.remove(key, index + 1);
      let max = 0;
      for (let i = 0; i < this.values.length; ++i) {
        const chr = this.values[i] as string;
        const child = this.children[chr];
        max = Math.max(child.score, max);
      }
      this.score = max;
      this.sorted = false; // Our sort could be invalidated.
    }
  }

  // Find the node responsible for the given prefix.
  // Index indicates how far we've looked already.
  // Returns null if no such node could be found.
  findPrefix(key: string, index: number): Node<T> | null {
    if (this.leaf || index === key.length) {
      return this;
    }

    const chr = key[index];
    const child = this.children[chr];
    if (child) {
      return child.findPrefix(key, index + 1);
    }

    return null;
  }

  /*
   * Recurse over all child nodes to get the top N results by score.
   *
   * We do this using a best-first-search with the score we've cached
   * on each node.
   *
   * We use the passed in pqueue which has a limit and unique flag to
   * configure the search.
   */
  getSortedResults(
    prefix: string,
    results: Array<T>,
    opts: SearchOptions,
  ) {
    const seenKeys = new Set<string>();

    if (this.leaf) {
      if (!this.sorted) {
        this.sort();
      }

      for (let i = 0; i < this.values.length; i++) {
        const item = this.values[i] as Item<T>;
        if (item.key.startsWith(prefix)) {
          if (!opts.unique || !seenKeys.has(item.distinct || item.key)) {
            seenKeys.add(item.distinct || item.key);
            results.push(item.value);
            if (results.length === opts.limit) {
              return;
            }
          }
        }
      }
    } else {
      const pqueue = new PQueue<T>();
      pqueue.addAll([this]);

      let next: Node<T> | Item<T> | undefined;
      while ((next = pqueue.pop())) {
        if (next instanceof Node) {
          if (!next.sorted) {
            next.sort();
          }

          if (next.leaf) {
            pqueue.addAll(next.values as Array<Item<T>>);
          } else {
            const children = next.children;
            pqueue.addAll((next.values as Letter[]).map(v => children[v]));
          }
        } else {
          if (!opts.unique || !seenKeys.has(next.distinct || next.key)) {
            seenKeys.add(next.distinct || next.key);
            results.push(next.value);
          }
          if (results.length === opts.limit) {
            return;
          }
        }
      }
    }
  }

  private sort(): void {
    if (this.sorted) {
      return;
    }
    this.sorted = true;

    if (this.leaf) {
      (this.values as Array<Item<T>>).sort((a, b) => b.score - a.score);
    } else {
      (this.values as Letter[]).sort(
        (a, b) => this.children[b].score - this.children[a].score
      );
    }
  }
}

export default Node;
