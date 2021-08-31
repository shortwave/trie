const contacts = require('./contacts.json');
const { default: Trie, roughSizeOfObject } = require('../dist');

const Benchmark = require('benchmark');

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

suite.add('Trie#populate', () => setup(new Trie()));

function addBenchmarkTest(prefix, limit) {
  const t = new Trie();
  setup(t);
  suite.add(`Trie#lookupPrefix(${prefix}, ${limit})`, function() {
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
 // The original SH benchmark was:
 Populate#trie x 9.58 ops/sec ±3.10% (27 runs sampled)
 0.703816
 0.064667
 LookupPrefix:
 LookupPrefix x 2,206,769 ops/sec ±0.85% (95 runs sampled)


Trie#populate x 7.50 ops/sec ±2.48% (19 runs sampled)
Trie#lookupPrefix(, 5) x 2,144 ops/sec ±1.63% (85 runs sampled)
Trie#lookupPrefix(t, 5) x 23,947 ops/sec ±0.23% (89 runs sampled)
Trie#lookupPrefix(somethingthatwontevermatchanythingatall, 5) x 12,691,661 ops/sec ±0.63% (87 runs sampled)
Trie#lookupPrefix(tee, 3) x 3,540,266 ops/sec ±0.18% (88 runs sampled)
Trie#lookupPrefix(tee, 6) x 1,663,454 ops/sec ±0.79% (87 runs sampled)
Rough size of Trie 34.9750337600708 MB
 */
suite.run();

const t = new Trie();
setup(t);
const BYTES_IN_MB = 1024 * 1024;
console.log('Rough size of Trie', roughSizeOfObject(t) / BYTES_IN_MB, 'MB');
