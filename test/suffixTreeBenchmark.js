const contacts = require('./contacts.json');
const { default: Trie, roughSizeOfObject } = require('../dist');

const Benchmark = require('benchmark');

const suite = new Benchmark.Suite();

function suffixAdd(t, key, score, value, distinct) {
  for (let q = 0; q < key.length; q++) {
    t.add({
      key: key.slice(q),
      score,
      value,
      distinct,
    });
  }
}

function setup(t) {
  contacts.forEach(function(data) {
    const score = data.score;
    const email = (data.email || '-').toLowerCase();
    const name = data.name.toLowerCase();
    const distinct = email + name;
    suffixAdd(t, email, score, data, distinct);
    suffixAdd(t, name, score, data, distinct);
  });
}

suite.add('NaiveSuffixTrie#populate', () => setup(new Trie()));

function addBenchmarkTest(prefix, limit) {
  const t = new Trie();
  setup(t);
  suite.add(`NaiveSuffixTrie#lookupPrefix(${prefix}, ${limit})`, function() {
    t.prefixSearch(prefix, { limit, unique: true });
  });
}

addBenchmarkTest('', 5);
addBenchmarkTest('t', 5);
addBenchmarkTest('somethingthatwontevermatchanythingatall', 5);
addBenchmarkTest('tee', 3);
addBenchmarkTest('tee', 6);

suite.on('cycle', event => console.log(String(event.target)));

/*
NaiveSuffixTrie#populate x 0.09 ops/sec ±69.35% (5 runs sampled)
NaiveSuffixTrie#lookupPrefix(, 5) x 0.04 ops/sec ±97.39% (5 runs sampled)
NaiveSuffixTrie#lookupPrefix(t, 5) x 44.25 ops/sec ±17.60% (58 runs sampled)
NaiveSuffixTrie#lookupPrefix(somethingthatwontevermatchanythingatall, 5) x 928,325 ops/sec ±1.09% (86 runs sampled)
NaiveSuffixTrie#lookupPrefix(tee, 3) x 2,414,849 ops/sec ±1.74% (76 runs sampled)
NaiveSuffixTrie#lookupPrefix(tee, 6) x 1,524,420 ops/sec ±1.04% (78 runs sampled)
Rough size of NaiceSuffixTrie 510.87034797668457 MB
 */
suite.run();

const t = new Trie();
setup(t);
const BYTES_IN_MB = 1024 * 1024;
console.log(
  'Rough size of NaiceSuffixTrie',
  roughSizeOfObject(t) / BYTES_IN_MB,
  'MB'
);
