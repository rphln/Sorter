import React from "react";
import ReactDOM from "react-dom";
import { makeAutoObservable, runInAction } from "mobx";
import { observer } from "mobx-react";
import {
  castArray,
  cloneDeep,
  filter,
  find,
  isEmpty,
  range,
  shuffle,
  size,
  some,
  sortBy,
  times,
  xor,
} from "lodash";

import followedManga from "./followed-manga.json";

/**
 * A pair of elements to be sorted.
 */
type Tuple<T> = [T, T];

/**
 * The edges of a graph as an adjacency matrix.
 */
type Matrix<T> = T[][];

/**
 * Returns an iterator over the combinations with no replacement of the specified elements.
 * @param elements The elements with which the pairs will be made.
 * @param n The number of elements per combination.
 */
function combinations<T>(elements: T[], n: number = 2): T[][] {
  if (n == 1) return elements.map(castArray);

  return elements.flatMap((first, index) => {
    return combinations(elements.slice(index + 1), n - 1).map((partial) => {
      return [first, ...partial];
    });
  });
}

class State<T> {
  elements: T[];
  pairs: Tuple<number>[];
  edges: Matrix<boolean>;
  skips: Matrix<number>;
  history: Tuple<number>[];

  constructor(elements: T[]) {
    this.elements = elements;
    this.history = [];

    this.pairs = shuffle(
      combinations(range(elements.length))
    ) as Tuple<number>[];

    this.edges = times(elements.length, () => {
      return times(elements.length, () => false);
    });

    this.skips = times(elements.length, () => {
      return times(elements.length, () => 1);
    });

    makeAutoObservable(this);
  }

  /***
   * The transitive closure of the current set of edges.
   */
  get closure(): Matrix<boolean> {
    const closure = cloneDeep(this.edges);

    for (const i of range(closure.length))
      for (const j of range(closure.length))
        for (const k of range(closure.length))
          closure[i][j] ||= closure[i][k] && closure[k][j];

    return closure;
  }

  /**
   * Whether the elements are fully sorted.
   */
  get isSorted(): boolean {
    return !this.current;
  }

  /**
   * Returns how many outward edges exit from the specified node.
   */
  degree(index: number): number {
    return size(filter(this.closure[index]));
  }

  /**
   * The list of pairs that need to be sorted.
   */
  get pending(): Tuple<number>[] {
    const pending = filter(this.pairs, ([i, j]) => {
      return (this.closure[i][j] || this.closure[j][i]) == false;
    });

    return sortBy(pending, ([left, right]) => {
      return (
        (this.degree(left) + 1) *
        (this.degree(right) + 1) *
        this.skips[left][right]
      );
    });
  }

  /**
   * The current pair to be sorted.
   */
  get current(): Tuple<number> | undefined {
    return find(this.pending);
  }

  /**
   * The left component of the current pair.
   */
  get left(): { key: number; name: T } | undefined {
    return (
      this.current && {
        key: this.current[0],
        name: this.elements[this.current[0]],
      }
    );
  }

  /**
   * The right component of the current pair.
   */
  get right(): { key: number; name: T } | undefined {
    return (
      this.current && {
        key: this.current[1],
        name: this.elements[this.current[1]],
      }
    );
  }

  get result(): T[] {
    return sortBy(this.elements, (_, index) => this.degree(index));
  }

  choose(upper: number, lower: number) {
    this.record(upper, lower);

    this.edges[upper][lower] ||= true;
  }

  chooseBoth(left: number, right: number) {
    this.choose(left, right);
    this.choose(right, left);
  }

  record(left: number, right: number) {
    const found = some(this.history, (h) => {
      return isEmpty(xor(h, [left, right]));
    });

    if (found === false) this.history.push([left, right]);
  }

  undo() {
    if (this.history.length === 0) return;

    const [left, right] = this.history.pop() as Tuple<number>;

    this.edges[left][right] = false;
    this.edges[right][left] = false;
  }

  postpone() {
    if (!this.current) return;

    const [left, right] = this.current;
    this.skips[left][right] *= 2;
  }
}

const App = observer(
  ({
    state: { left, right, result, isSorted, pending, history },
  }: {
    state: State<any>;
  }) => {
    if (isSorted)
      return (
        <>
          <p>Completed in {history.length} choices.</p>
          <ol type="1">
            {result.map((e, idx) => (
              <li key={idx}>
                <a href={`https://mangadex.org/title/${e.mangaId}/`}>
                  {e.mangaTitle}
                </a>
              </li>
            ))}
          </ol>
        </>
      );

    return (
      <div className="columns is-vcentered is-multiline">
        <div className="column has-text-centered is-two-fifths">
          <p className="my-4">
            <button
              className="button"
              onClick={() => {
                state.choose(left?.key as number, right?.key as number);
              }}
            >
              {left?.name.mangaTitle}
            </button>
          </p>
          <p className="my-4">
            <a href={`https://mangadex.org/title/${left?.name.mangaId}/`}>
              View on MangaDex
            </a>
          </p>
        </div>
        <div className="column has-text-centered">
          <p className="my-4">
            <button
              className="button"
              onClick={() => {
                runInAction(() => {
                  state.choose(left?.key as number, right?.key as number);
                  state.choose(right?.key as number, left?.key as number);
                });
              }}
            >
              Tie
            </button>
          </p>
          <p className="my-4">
            <button className="button" onClick={() => state.postpone()}>
              Postpone
            </button>
          </p>
          <p className="my-4">
            <button className="button" onClick={() => state.undo()}>
              Undo
            </button>
          </p>
        </div>
        <div className="column has-text-centered is-two-fifths">
          <p className="my-4">
            <button
              className="button"
              onClick={() => {
                state.choose(right?.key as number, left?.key as number);
              }}
            >
              {right?.name.mangaTitle}
            </button>
          </p>
          <p className="my-4">
            <a href={`https://mangadex.org/title/${right?.name.mangaId}/`}>
              View on MangaDex
            </a>
          </p>
        </div>
        <div className="column is-full has-text-centered">
          <p>You've made {history.length} choice(s) so far.</p>
          <p>There are {pending.length} pairs left.</p>
        </div>
      </div>
    );
  }
);

const state = new State(followedManga);

ReactDOM.render(<App state={state} />, document.getElementById("main"));
