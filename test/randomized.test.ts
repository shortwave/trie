import Trie, { Item, SearchOptions } from '../src/index';
import seedrandom from 'seedrandom';
import {
  remove,
  orderBy,
  take,
  uniqBy,
  sample,
  random,
  isEqual,
  isNumber,
} from 'lodash';

interface TestValue {
  readonly id: string;
  readonly score: number;
}

interface AddOp {
  readonly type: 'add';
  readonly item: Item<TestValue>;
}

interface RemoveOp {
  readonly type: 'remove';
  readonly key: string;
}

interface SearchOp {
  readonly type: 'search';
  readonly prefix: string;
  readonly unique: boolean;
  readonly limit: number;
}

type Op = AddOp | RemoveOp | SearchOp;

// Number of operations to do.
const ITERATIONS = 10_000;
// The approximate number of items we try to keep in the autocompleter.
const APPROX_ITEM_COUNT = 20;

/** A simple and correct autocompleter (an inefficent version of the trie). */
class SimpleAutocompleter<T> {
  private readonly items: Array<Item<T>> = [];

  sampleKey(): string {
    if (this.items.length === 0) throw new Error();
    return sample(this.items)!.key;
  }

  size(): number {
    return this.items.length;
  }

  add(item: Item<T>) {
    this.items.push(item);
  }

  remove(key: string) {
    remove(this.items, i => i.key === key);
  }

  prefixSearch(prefix: string, opts: Partial<SearchOptions> = {}): T[] {
    let results = orderBy(this.items, ({ score }) => score, 'desc');
    results = results.filter(({ key }) => key.startsWith(prefix));
    if (opts.unique) {
      results = uniqBy(results, item => item.distinct || item.key);
    }
    if (isNumber(opts.limit)) {
      results = take(results, opts.limit);
    }
    return results.map(({ value }) => value);
  }
}

function randomId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  let result = '';
  for (let i = 0; i < 20; ++i) {
    result += sample(alphabet);
  }
  return result;
}

function randomValue(): TestValue {
  return {
    id: randomId(),
    score: random(1, 10_000),
  };
}

describe('Trie Choas Monkey', () => {
  it('can handle randomized operations', () => {
    const seed = randomId();
    seedrandom(seed, { global: true, entropy: false });
    console.log('SEED:', seed);
    const s = new SimpleAutocompleter<TestValue>();
    const t = new Trie<TestValue>({ maxWidth: APPROX_ITEM_COUNT });

    function generateOp(opType: Op['type']): Op {
      switch (opType) {
        case 'add':
          const v = randomValue();
          return {
            type: opType,
            item: { score: v.score, key: v.id, value: v },
          };
        case 'remove':
          return { type: opType, key: s.sampleKey() };
        case 'search':
          const k = s.sampleKey();
          return {
            type: opType,
            limit: random(1, 1000),
            unique: sample([true, false])!,
            prefix: k.substr(0, random(0, k.length)),
          };
      }
    }

    for (let i = 0; i < APPROX_ITEM_COUNT; ++i) {
      const v = randomValue();
      const item = {
        score: v.score,
        key: v.id,
        value: v,
      };
      s.add(item);
      t.add(item);
      t.validateInvariants();
    }

    const stats: Record<Op['type'], number> = {
      add: 0,
      remove: 0,
      search: 0,
    };
    for (let i = 0; i < ITERATIONS; ++i) {
      let possibleOps: Op['type'][] = ['add', 'remove', 'search'];
      if (s.size() === 0) {
        possibleOps = ['add'];
      } else if (s.size() < APPROX_ITEM_COUNT) {
        possibleOps.push('add', 'add');
      } else if (s.size() < APPROX_ITEM_COUNT * 2) {
        possibleOps.push('add');
      }
      const op = generateOp(sample(possibleOps)!);
      ++stats[op.type];

      switch (op.type) {
        case 'add': {
          s.add(op.item);
          t.add(op.item);
          t.validateInvariants();
          break;
        }
        case 'remove': {
          s.remove(op.key);
          t.remove({key: op.key});
          t.validateInvariants();
          break;
        }
        case 'search': {
          const expected = s.prefixSearch(op.prefix, {
            unique: op.unique,
            limit: op.limit,
          });
          const actual = t.prefixSearch(op.prefix, {
            unique: op.unique,
            limit: op.limit,
          });
          // We can't check strict ordering for ids because the order of elements with the same score is undefined.
          const actualIds = actual.map(({ id }) => id).sort();
          const actualScores = actual.map(({ score }) => score);
          const expectedIds = expected.map(({ id }) => id).sort();
          const expectedScores = expected.map(({ score }) => score);
          if (
            !isEqual(actualIds, expectedIds) ||
            !isEqual(actualScores, expectedScores)
          ) {
            const msg = `Operation ${JSON.stringify(
              op
            )} failed. Got: ${JSON.stringify(
              actual,
              null,
              2
            )}, Expected: ${JSON.stringify(expected, null, 2)}`;
            console.error(msg);
            fail(msg);
          }
          t.validateInvariants();
          break;
        }
      }
    }
    const percentage = (op: Op['type']) =>
      `${((stats[op] / ITERATIONS) * 100).toFixed(2)}%`;
    console.log(
      `STATS:\nFINAL SIZE: ${s.size()}\nADD OPS: ${percentage(
        'add'
      )}\nREMOVE OPS: ${percentage('remove')}\nSEARCH OPS: ${percentage(
        'search'
      )}`
    );
  });
});
