import React from "react";
import ReactDOM from "react-dom";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react";

const combinations = (list) =>
  list.flatMap((x, idx) => list.slice(idx + 1).map((y) => [x, y]));

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
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
      (p, q) =>
        this.#getNodesLessThan(p).length < this.#getNodesLessThan(q).length
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

  #getNodesLessThan(node) {
    return this.edges[node].reduce(
      (adjacentNodes, neighbour) => [
        ...adjacentNodes,
        ...this.#getNodesLessThan(neighbour),
      ],
      this.edges[node]
    );
  }

  #cleanup() {
    this.pending = this.pending.filter(([p, q]) => {
      const hasRight = this.#getNodesLessThan(p).indexOf(q) >= 0;
      const hasLeft = this.#getNodesLessThan(q).indexOf(p) >= 0;

      return (hasRight || hasLeft) == false;
    });
  }
}

const App = observer(
  ({ state: { left, right, result, remaining, isSorted, comparisons } }) => {
    if (isSorted)
      return (
        <ol type="1">
          {result.map((e, idx) => (
            <li key={idx}>{e}</li>
          ))}
        </ol>
      );

    return (
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
          So far, <code>{comparisons}</code> comparisons were made. There are,
          at most, <code>{remaining}</code> comparisons remaining.
        </div>
      </div>
    );
  }
);

const state = new State([
  "Only Sense Online",
  "Tensei Shitara Slime Datta Ken",
  "Seishun no After",
  "Bara Kangoku no Kemono-tachi",
  "Ani no Yome to Kurashite Imasu.",
  "Arifureta Shokugyou de Sekai Saikyou",
  "Buddy Go!",
  "29-sai Dokushin Chuuken Boukensha no Nichijou",
  "Ane Naru Mono",
  "Atom - The Beginning",
  "Oroka na Tenshi wa Akuma to Odoru",
  "Kenja no Deshi wo Nanoru Kenja",
  "Musuko ga Kawaikute Shikataganai Mazoku no Hahaoya",
  "Magical Trans!",
  "Tensei Shitara Ken Deshita",
  "Seifuku no Vampiress Lord",
  "Goblin Is Very Strong",
  "Catulus Syndrome",
  "Toaru Kagaku no Railgun Gaiden - Astral Buddy",
  "Yuuutsu-kun to Succubus-san",
  "Yasei no Last Boss ga Arawareta!",
  "Nozomanu Fushi no Boukensha",
  "Goodbye! Isekai Tensei",
  "The Vengeful White Cat Lounging on the Dragon King's Lap",
  "Slime Taoshite 300-nen, Shiranai Uchi ni Level MAX ni Nattemashita",
  "Danshi Koukousei ga Mahou Shoujo ni Naru Hanashi",
  "Monster Musume no Oishasan",
  "Bocchi Kaibutsu to Moumoku Shoujo",
  "Ore to Hero to Mahou Shoujo",
  "Bokura wa Mahou Shounen",
  "Higyaku no Noel",
  "About Getting Asked Out by the Biggest Misogynist in School",
  "Maou-sama to Kekkon shitai",
  "The Story of a Yakuza Boss Reborn as a Little Girl",
  "Lady Rose Wants to Be a Commoner",
  "Otome Kaijuu Caramelize",
  "Kemono Michi",
  "Kitaku Tochuu de Yome to Musume ga Dekita n dakedo, Dragon datta.",
  "Monochrome Lovers",
  "Fukakai na Boku no Subete o",
  "Hokenshitsu no Tsumuri-san",
  "Rakuen no Chloris",
  "Tate no Yuusha no Toaru Ichinichi",
  "Ore ga Watashi ni Naru made (Pre-Serialization)",
  "About a Lazy High School Guy Who Woke Up as a Girl One Morning (web comic)",
  "Josoushite Mendokusai Koto ni Natteru Nekura to Yankee Ryou Kataomoi",
  "How to Make a &quot;Girl&quot; Fall in Love",
  "Isekai Ojisan",
  "Mieruko-chan",
  "Killing Me / Killing You",
  "Tokedase! Mizore-chan",
  "Chicchai Senpai ga Kawaisugiru.",
  "I Shaved. Then I Brought a High School Girl Home.",
  "Bokutachi no Remake",
  "My First Love Was a Beautiful &quot;Girl&quot;",
  "Sukinako ga Megane wo Wasureta",
  "Shachiku Succubus no Hanashi",
  "Welcome to Japan, Elf-san!",
  "Do You Think Someone Like You Could Defeat the Demon Lord?",
  "Yuusha to Maou no Konpaku Rekitei (Extasis)",
  "Zombie 100 ~Zombie ni Naru Made ni Shitai 100 no Koto~",
  "ChinChin KemoKemo",
  "Roujoteki Shoujo Hinata-chan",
  "Hira yakunin yatte 1500-nen, maou no chikara de daijin ni sa re chaimashita",
  "Yuusha wa Shimei wo Wasureteru",
  "Kono Sekai wa Tsuite Iru",
  "Looking up to Magical Girls",
  "Pumpkin Time",
  "Samayoeru Tensei-sha-tachi no Relive Game",
  "Madoka no Himitsu",
  "Jinrou e no Tensei, Maou no Fukkan: Hajimari no Shou",
  "If My Wife Became an Elementary School Student",
  "Chiisana Mori no Ookami-chan",
  "Is It Odd That I Became an Adventurer Even If I Graduated From the Witchcraft Institute?",
  "Arifureta Shokugyou de Sekai Saikyou Zero",
  "Ore ga Watashi ni Naru made",
  "A Lazy Guy Woke Up as a Girl One Morning",
  "My Junior Was My Mom in Her Past Life",
  "Necromance",
  "Maou no Musume wa Yasashi Sugiru!!",
  "Today Once Again, the Assassin Cannot Win Against the Girl He Picked Up!",
  "The Dragon, the Hero, and the Courier",
  "Yakuza Reincarnation",
  "Have You Seen Me?",
  "Eiyuu-ou, Bu wo Kiwameru tame Tenseisu",
  "An Evil Dragon That Was Sealed Away for 300 Years Became My Friend (Pre-Serialization)",
  "Silver Plan to Redo From JK",
  "Tales of Reincarnation in Maydare",
  "SA07",
  "A Choice of Boyfriend and Girlfriend",
  "A Manga About High School Boys Who Woke Up as Girls One Morning",
  "GGWP. ~Young Ladies Don't Play Fighting Games~",
  "Natsume to Natsume",
  "The Sheep Princess in Wolf's Clothing",
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
