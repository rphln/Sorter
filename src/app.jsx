import React from "react";
import ReactDOM from "react-dom";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react";

const combinations = (list) =>
  list.flatMap((x, idx) => list.slice(idx + 1).map((y) => [x, y]));

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

class State {
  constructor(elements) {
    this.elements = elements;
    this.comparisons = 0;

    this.pending = combinations(elements);
    this.edges = elements.reduce((edges, key) => ({ ...edges, [key]: [] }), {});

    shuffleArray(this.pending);

    makeAutoObservable(this);
  }

  get remaining() {
    return this.pending.length;
  }

  get isSorted() {
    return this.remaining === 0;
  }

  get current() {
    return this.pending[0];
  }

  get left() {
    return this.current?.[0];
  }

  get right() {
    return this.current?.[1];
  }

  get result() {
    return Object.keys(this.edges).sort(
      (p, q) => this.edges[p].length > this.edges[q].length
    );
  }

  postpone() {
    this.pending.push(this.pending.shift());
  }

  chooseLeft() {
    this.comparisons += 1;

    this.edges[this.left].push(this.right);
    this.pending.shift();

    this.#cleanup();
  }

  chooseRight() {
    this.comparisons += 1;

    this.edges[this.right].push(this.left);
    this.pending.shift();

    this.#cleanup();
  }

  #getNodesLessThan(edges, node) {
    return edges[node].reduce(
      (adjacentNodes, neighbour) =>
        new Set([
          ...adjacentNodes,
          ...this.#getNodesLessThan(edges, neighbour),
        ]),
      new Set(edges[node])
    );
  }

  #cleanup() {
    this.pending = this.pending.filter(([p, q]) => {
      const hasRight = this.#getNodesLessThan(this.edges, p).has(q);
      const hasLeft = this.#getNodesLessThan(this.edges, q).has(p);

      return (hasRight || hasLeft) == false;
    });
  }
}

const App = observer(
  ({ state: { left, right, result, remaining, isSorted, comparisons } }) => (
    <div class="content">
      {isSorted ? (
        <ol type="1">
          {result.map((e, idx) => (
            <li key={idx}>{e}</li>
          ))}
        </ol>
      ) : (
        <div className="columns is-vcentered is-multiline">
          <div className="column has-text-centered is-two-fifths">
            <button className="button" onClick={() => state.chooseLeft()}>
              {left}
            </button>
          </div>
          <div className="column has-text-centered">
            <button className="button" onClick={() => state.postpone()}>
              Postpone
            </button>
          </div>
          <div className="column has-text-centered is-two-fifths">
            <button className="button" onClick={() => state.chooseRight()}>
              {right}
            </button>
          </div>
          <div className="column is-full has-text-centered">
            So far, <code>{comparisons}</code> comparisons were made. There are
            at most <code>{remaining}</code> comparisons remaining.
          </div>
        </div>
      )}
    </div>
  )
);

const state = new State([
  "Kumo Desu ga, Nani ka?",
  "Jun and Kaoru",
  "Houseki no Kuni",
  "Made in Abyss",
  "Majo no Geboku to Maou no Tsuno",
  "Kusuriya no Hitorigoto",
  "Onii-chan Is Done For!",
  "Sewayaki Kitsune no Senko-san",
  "Gokushufudou: The Way of the House Husband",
  "Sengoku Komachi Kuroutan: Noukou Giga",
  "Maou no Ore ga Dorei Elf wo Yome ni Shitanda ga, Dou Medereba ii?",
  "Boukensha ni Naritai to Miyako ni Deteitta Musume ga S Rank ni Natteta",
  "Ano Hito no I ni wa Boku ga Tarinai",
  "Shougakusei ga Mama demo Ii desu ka?",
  "Taimashi to Akuma-chan",
  "Demi Life!",
  "Machikado Mazoku",
  "Yofukashi no Uta",
  "Is This What a God-Tier Game Means?",
  "Fantasy Bishoujo Juniku Ojisan to",
]);

ReactDOM.render(<App state={state} />, document.getElementById("main"));
