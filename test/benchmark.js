const contacts = require('./contacts.json');
const { default: Trie } = require('../dist');

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
  suite.add(
    `Trie#lookupPrefix(${prefix}, ${limit})`,
    function() {
      t.prefixSearch(prefix, { limit, unique: true });
    },
    { setup: () => setup(t) }
  );
}

addBenchmarkTest('t', 5);
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
 */
suite.run();
