const contacts = require('./contacts.json');
const { roughSizeOfObject } = require('../dist');

const Benchmark = require('benchmark');
const lunr = require('elasticlunr');

const suite = new Benchmark.Suite();

function setup() {
  return lunr(function() {
    this.addField('name');
    this.addField('email');
    this.setRef('distinct');

    contacts.forEach(data => {
      const score = data.score;
      const email = (data.email || '-').toLowerCase();
      const name = data.name.toLowerCase();
      const distinct = email + name;
      this.addDoc({ score, email, name, distinct });
    });
  });
}

suite.add('elasticlunr#populate', () => setup());

function addBenchmarkTest(prefix) {
  const t = setup();
  suite.add(`elasticlunr#search(${prefix})`, function() {
    t.search(prefix, {});
  });
}

addBenchmarkTest('');
addBenchmarkTest('t');
addBenchmarkTest('somethingthatwontevermatchanythingatall');
addBenchmarkTest('tee');

suite.on('cycle', event => console.log(String(event.target)));

/*
elasticlunr#populate x 0.34 ops/sec ±37.07% (5 runs sampled)
elasticlunr#search() x 852,101,814 ops/sec ±0.70% (86 runs sampled)
elasticlunr#search(t) x 356 ops/sec ±1.08% (81 runs sampled)
elasticlunr#search(somethingthatwontevermatchanythingatall) x 265,674 ops/sec ±1.22% (83 runs sampled)
elasticlunr#search(tee) x 373,034 ops/sec ±0.58% (84 runs sampled)
Rough size of elasticlunr 34.31093978881836 MB
 */
suite.run();

const t = setup();
const BYTES_IN_MB = 1024 * 1024;
console.log(
  'Rough size of elasticlunr',
  roughSizeOfObject(t) / BYTES_IN_MB,
  'MB'
);
