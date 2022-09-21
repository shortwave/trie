import {describe, it, expect} from 'vitest';
import Trie from '../src/index';

describe('Trie Performance', () => {
  it('should work on larger tries', () => {
    interface Contact {
      readonly email: string;
      readonly name: string;
      readonly score: number;
    }

    const contacts = require('./contacts.json') as readonly Contact[];

    const t = new Trie<Contact>();

    for (const contact of contacts) {
      t.add({
        key: contact.email,
        distinct: contact.email + contact.name,
        score: contact.score,
        value: contact,
      });

      t.add({
        key: contact.name.toLowerCase(),
        distinct: contact.email + contact.name,
        score: contact.score,
        value: contact,
      });
    }
    t.validateInvariants();

    let results = t.prefixSearch('t', { limit: 5 });
    expect(results.map(result => result.email)).toEqual([
      'tellus.Nunc.lectus@ullamcorpereu.org',
      'risus.at.fringilla@Fusce.com',
      'tortor@Cras.org',
      'tortor@penatibusetmagnis.com',
      'tellus.Nunc.lectus@ligulaeuenim.com',
    ]);

    t.validateInvariants();

    results = t.prefixSearch('sh', { limit: 5 });
    expect(results.map(result => result.email)).toEqual([
      'ornare@acrisus.co.uk',
      'a.ultricies@a.com',
      'Etiam.bibendum@necquam.org',
      'orci.adipiscing.non@euligulaAenean.net',
      'mi.tempor.lorem@scelerisquedui.ca',
    ]);

    t.validateInvariants();

    results = t.prefixSearch('rap', { limit: 5 });
    expect(results.map(result => result.email)).toEqual([
      'velit.justo@nonegestas.net',
      'Fusce.aliquet.magna@esttemporbibendum.net',
      'auctor.velit.eget@risusDuisa.co.uk',
      'vehicula.Pellentesque.tincidunt@leoelementumsem.com',
      'arcu.vel@velitinaliquet.net',
    ]);

    t.validateInvariants();

    results = t.prefixSearch('zachary ba', { limit: 5 });
    expect(results.map(result => result.email)).toEqual([
      'blandit@duiFuscediam.ca',
    ]);

    t.validateInvariants();
  }, 5000);
});
