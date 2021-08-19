/** An item within the Trie. */
export interface Item<T> {
  /** The prefix search value. */
  readonly key: string;
  /** A positive score to rank prefix results by. */
  readonly score: number;
  /** An opaque value to return in searches. */
  readonly value: T;
  /** Used to distinguish between multiple items that have the same `value`, but different keys in the trie. */
  readonly distinct?: string;
}

/** Options for when searching the Trie. */
export interface SearchOptions {
  /** If you only want one result per-key */
  readonly unique: boolean;
  /** Max number of results to return */
  readonly limit: number;
}
