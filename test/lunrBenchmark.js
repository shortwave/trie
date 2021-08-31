const contacts = require('./contacts.json');
const { roughSizeOfObject } = require('../dist');

const Benchmark = require('benchmark');
const lunr = require('lunr');

const suite = new Benchmark.Suite();

function setup() {
  return lunr(function() {
    this.field('name');
    this.field('email');
    this.ref('distinct');

    contacts.forEach(data => {
      const score = data.score;
      const email = (data.email || '-').toLowerCase();
      const name = data.name.toLowerCase();
      const distinct = email + name;
      this.add({ score, email, name, distinct });
    });
  });
}

suite.add('lunr#populate', () => setup());

function addBenchmarkTest(prefix) {
  const t = setup();
  suite.add(`lunr#search(${prefix})`, function() {
    t.search(prefix);
  });
}

addBenchmarkTest('');
addBenchmarkTest('t');
addBenchmarkTest('somethingthatwontevermatchanythingatall');
addBenchmarkTest('tee');

suite.on('cycle', event => console.log(String(event.target)));

/*
lunr#populate x 0.26 ops/sec ±3.60% (5 runs sampled)
lunr#search() x 1.89 ops/sec ±49.26% (11 runs sampled)
lunr#search(t) x 194 ops/sec ±1.99% (67 runs sampled)
lunr#search(somethingthatwontevermatchanythingatall) x 130,564 ops/sec ±0.97% (86 runs sampled)
lunr#search(tee) x 267,996 ops/sec ±1.18% (84 runs sampled)
Rough size of lunr 16.319193840026855 MB
 */
suite.run();

const t = setup();
const BYTES_IN_MB = 1024 * 1024;
console.log('Rough size of lunr', roughSizeOfObject(t) / BYTES_IN_MB, 'MB');
