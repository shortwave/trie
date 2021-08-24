A fast weighted auto-completion trie.

<a href="https://badge.fury.io/js/%40shortwave%2Ftrie"><img src="https://badge.fury.io/js/%40shortwave%2Ftrie.svg" alt="npm version" height="18"></a>

Usage
=====

```typescript

import Trie from '@shortwave/trie';

const trie = new Trie<Contact>();

trie.add({
    key: "richard",
    value: {name: "Richard", ...},
    score: 5
});

trie.add({
    key: "rachael",
    value: {name: "Rachael", ...},
    score: 1
});

trie.add({
    key: "sarah",
    value: {name: "Sarah", ...},
    score: 3
});

trie.add({
    key: "sam",
    value: {name: "Sam", ...},
    score: 2
});

// The limit option limits the number of results.
// The unique option returns only the first result for each key
// (the trie can store multiple values per key)
trie.prefixSearch('r', {limit: 3, unique: true})
//=> [{name: "Richard", ...} , {name: "Rachael", ...}]


// You can also remove nodes from the tree.
trie.remove({key: "sarah"});
```

Efficiency
==========

The problem with building a search tree for contacts is that the order of
results is orthogonal from the search.

If I type "R", my dad ("Richard") should be the first auto-completion result, not
my friend "Rachael" who I haven't spoken to for a year.

To do this nodes in the trie have their highest score attached:

```
                     + (4) rachael
           + (4) r --+ (1) richard
  root ----+
           + (3) s ---+ (3) a ---+ (3) sarah
                                 + (2) sam
```

To improve indexing time, sub-nodes are not sorted; so on the first access to
each section of the tree you have to pay the cost of sorting the sub-nodes (
this is usually a very small sort, <5 entries, per node in the tree).

There's also a special case for nodes with one child, where we don't expand
them out letter by letter. (An exercise for the reader would be to use a
fully compressed trie, which would give us this optimization as a side-effect)

The search algorithm maintains a queue of nodes to visit based on score, and is
truncated to the limit. The most expensive part of the search is merging the
current node's children into the priority queue, and so the efficiency of lookup
is dominated by the limit parameter, with some additional cost due to having to
traverse many intermediate nodes (see note about implementing a compressed trie).

Meta-fu
=======

This code base started out as the trie implementation from
https://github.com/superhuman/trie-ing with changes for typescript and deletion.

See LICENSE for original copyright holder, changes are also released under the MIT license.
