import contacts from './contacts.json';
import Trie from '../src/index';
import {describe, bench, beforeEach} from 'vitest'

function setup(t: Trie<unknown>) {
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

describe('Trie', () => {
  bench('populate', () => {
    setup(new Trie());
  });


  describe('lookupPrefix', () => {

    let t = new Trie<unknown>();
    beforeEach(() => {
      t = new Trie();
      setup(t);
    });

    function addBenchmarkTest(prefix: string, limit: number) {
      bench(`(${prefix}, ${limit})`, () => {
        t.prefixSearch(prefix, { limit, unique: true });
      });
    }

    addBenchmarkTest('t', 5);
    addBenchmarkTest('tee', 3);
    addBenchmarkTest('tee', 6);
  });
});
