import Node from './node';
import { Item } from './common';

/**
 *  A standard priority queue.
 *
 *  TODO(perf): We should probably have some sort of max heap solution and lazily merge the lists instead of eagerly
 *  doing it. In the case of high maxWidth and low limits (likely) it's probably faster.
 */
class PQueue<T> {
  private readonly todo: Array<Node<T> | Item<T>> = [];

  /** Add a sorted list of "score"-ables to the priority queue. */
  addAll(list: Array<Node<T> | Item<T>>): void {
    let j = 0;

    for (let i = 0; i < this.todo.length && j < list.length; ++i) {
      if (this.todo[i].score < list[j].score) {
        this.todo.splice(i, 0, list[j]);
        j += 1;
      }
    }

    for (; j < list.length; ++j) {
      this.todo.push(list[j]);
    }
  }

  pop(): Node<T> | Item<T> | undefined {
    return this.todo.shift();
  }
}

export default PQueue;
