// import contacts from './contacts.json';
// import { FlatList } from '../dist';
// import { once } from 'lodash';

// import Benchmark from 'benchmark';
const contacts = require('./contacts.json');
const { FlatList, roughSizeOfObject } = require('../dist');

const Benchmark = require('benchmark');

// interface Contact {
//   readonly name: string;
//   readonly email: string;
//   readonly score: number;
// }
// const typedContacts = contacts as readonly Contact[];

const suite = new Benchmark.Suite();

function setup(t) {
  contacts.forEach(function(data) {
    const email = (data.email || '-').toLowerCase();
    const name = data.name.toLowerCase();

    const score = data.score;

    t.add({
      key: email,
      score: score,
      value: data,
      distinct: email + name,
    });

    t.add({
      key: name,
      score: score,
      value: data,
      distinct: email + name,
    });
  });
}

suite.add('FlatList#populate', () => setup(new FlatList()));

function addBenchmarkTest(prefix, limit) {
  const t = new FlatList();
  setup(t);
  suite.add(
    `FlatList#lookupPrefix(${prefix}, ${limit})`,
    function() {
      t.unsortedPrefixSearch(prefix, { limit, unique: true });
    },
    { setup: () => setup(t) }
  );
}

addBenchmarkTest('', 5);
addBenchmarkTest('t', 5);
addBenchmarkTest('somethingthatwontevermatchanythingatall', 5);
addBenchmarkTest('tee', 3);
addBenchmarkTest('tee', 6);

function sortedSetup(t) {
  setup(t);
  t.sort();
}

suite.add('FlatList#populateSort', () => sortedSetup(new FlatList()));

function addSortedBenchmarkTest(prefix, limit) {
  const t = new FlatList();
  sortedSetup(t);
  suite.add(`FlatList#lookupPrefixSorted(${prefix}, ${limit})`, function() {
    t.sortedPrefixSearch(prefix, { limit, unique: true });
  });
}

addSortedBenchmarkTest('', 5);
addSortedBenchmarkTest('t', 5);
addSortedBenchmarkTest('somethingthatwontevermatchanythingatall', 5);
addSortedBenchmarkTest('tee', 3);
addSortedBenchmarkTest('tee', 6);

function addSortedSubstringBenchmarkTest(prefix, limit) {
  const t = new FlatList();
  sortedSetup(t);
  suite.add(`FlatList#lookupSubstringSorted(${prefix}, ${limit})`, function() {
    t.sortedSubstringSearch(prefix, { limit, unique: true });
  });
}

addSortedSubstringBenchmarkTest('', 5);
addSortedSubstringBenchmarkTest('t', 5);
addSortedSubstringBenchmarkTest('somethingthatwontevermatchanythingatall', 5);
addSortedSubstringBenchmarkTest('tee', 3);
addSortedSubstringBenchmarkTest('tee', 6);

suite.on('cycle', event => console.log(String(event.target)));

/*
FlatList#populate x 14.75 ops/sec ±38.84% (31 runs sampled)
FlatList#lookupPrefix(, 5) x 3.25 ops/sec ±3.37% (13 runs sampled)
FlatList#lookupPrefix(t, 5) x 64.29 ops/sec ±8.76% (54 runs sampled)
FlatList#lookupPrefix(somethingthatwontevermatchanythingatall, 5) x 169 ops/sec ±0.61% (73 runs sampled)
FlatList#lookupPrefix(tee, 3) x 166 ops/sec ±2.96% (76 runs sampled)
FlatList#lookupPrefix(tee, 6) x 190 ops/sec ±0.56% (75 runs sampled)
FlatList#populateSort x 2.24 ops/sec ±32.55% (11 runs sampled)
FlatList#lookupPrefixSorted(, 5) x 1,906,935 ops/sec ±0.98% (87 runs sampled)
FlatList#lookupPrefixSorted(t, 5) x 171,410 ops/sec ±2.02% (88 runs sampled)
FlatList#lookupPrefixSorted(somethingthatwontevermatchanythingatall, 5) x 32.11 ops/sec ±1.00% (53 runs sampled)
FlatList#lookupPrefixSorted(tee, 3) x 944 ops/sec ±1.26% (77 runs sampled)
FlatList#lookupPrefixSorted(tee, 6) x 484 ops/sec ±2.60% (63 runs sampled)
FlatList#lookupSubstringSorted(, 5) x 2,150,871 ops/sec ±1.29% (87 runs sampled)
FlatList#lookupSubstringSorted(t, 5) x 1,211,808 ops/sec ±0.84% (84 runs sampled)
FlatList#lookupSubstringSorted(somethingthatwontevermatchanythingatall, 5) x 33.59 ops/sec ±0.28% (55 runs sampled)
FlatList#lookupSubstringSorted(tee, 3) x 4,488 ops/sec ±1.18% (85 runs sampled)
FlatList#lookupSubstringSorted(tee, 6) x 2,508 ops/sec ±0.94% (83 runs sampled)
Rough size of FlatList 34.93774223327637 MB
 */
suite.run();

const t = new FlatList();
setup(t);
const BYTES_IN_MB = 1024 * 1024;
console.log('Rough size of FlatList', roughSizeOfObject(t) / BYTES_IN_MB, 'MB');
