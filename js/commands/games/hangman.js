import { Command } from "../../command-system/command.js";

let wordList;

const alphabet = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const maxMistakes = 10;
const stressedFaces = [..."😶😣😥😮😫😪😯🤐😔😲☹😖😞😟😤😢😭😦😧😨😩😬🥶🥵😱😰😳🤕🤬😡😠🥺"];
const deadFaces = [..."💀☠👻"];
const winningFaces = [..."😀😁😃😄😅😆😉😊😎🙂😇🥳🧐"];

const gallows = [
	String.raw`






=======`,
	String.raw`|
|
|
|
|
|
|
=======`,
	String.raw`+----
|
|
|
|
|
|
=======`,
	String.raw`+---+
|   |
|
|
|
|
|
=======`,
	String.raw`+---+
|   |
|  @
|
|
|
|
=======`,
	String.raw`+---+
|   |
|  @
|   |
|
|
|
=======`,
	String.raw`+---+
|   |
|  @
|  /|
|
|
|
=======`,
	String.raw`+---+
|   |
|  @
|  /|\
|
|
|
=======`,
	String.raw`+---+
|   |
|  @
|  /|\
|  /
|
|
=======`,
	String.raw`+---+
|   |
|  @
|  /|\
|  / \
|
|
=======`,
	String.raw`+---+
|
|
|  @
|  \|/
|   |
|  / \
=======`,
];

export class Hangman extends Command {
	static names() { return ["hangman"]; }
	static description() { return "Play a game of hangman."; }

	async run(_args) {
		this.word = this.pickWord(await this.loadWords());
		this.guessed = new Set();
		this.won = false;
		this.face = this.pickFace(stressedFaces);
		this.output.write(this.frame());
		return new Promise(resolve => { this.resolve = resolve; });
	}

	async loadWords() {
		if (wordList) return wordList;
		const response = await fetch(new URL("../../../assets/hangman.txt", import.meta.url), { signal: this.signal });
		if (!response.ok) throw new Error("hangman: word list unavailable; run npm run build");
		wordList = (await response.text()).trim().split(/\s+/);
		return wordList;
	}

	pickWord(words) {
		return words[Math.floor(Math.random() * words.length)];
	}

	pickFace(faces) {
		const choices = faces.filter(face => face !== this.face);
		return choices[Math.floor(Math.random() * choices.length)];
	}

	handleInput(event) {
		if (!this.resolve) return;
		if (event.key === "Escape") {
			this.end(`Game quit. The word was ${this.word.toUpperCase()}.`);
			return;
		}

		const letter = event.key.toLowerCase();
		if (!/^[a-z]$/.test(letter) || this.guessed.has(letter)) return;
		this.guessed.add(letter);
		const won = [...this.word].every(character => this.guessed.has(character));
		const lost = !won && this.mistakes === maxMistakes;
		this.won = won;
		this.face = this.pickFace(won ? winningFaces : lost ? deadFaces : stressedFaces);
		this.output.replaceLast(this.frame());

		if (won) this.end(`You won! The word was ${this.word.toUpperCase()}. Congratulations!`);
		else if (lost) this.end(`You lost. The word was ${this.word.toUpperCase()}. Better luck next time!`);
	}

	get mistakes() {
		return [...this.guessed].filter(letter => !this.word.includes(letter)).length;
	}

	frame() {
		const word = [...this.word].map(letter => this.guessed.has(letter) ? letter.toUpperCase() : "_").join(" ");
		const unused = alphabet.filter(letter => !this.guessed.has(letter.toLowerCase()));
		const wrong = alphabet.filter(letter => this.guessed.has(letter.toLowerCase()) && !this.word.includes(letter.toLowerCase()));
		const correct = alphabet.filter(letter => this.guessed.has(letter.toLowerCase()) && this.word.includes(letter.toLowerCase()));

		return [
			...this.gallows(),
			"",
			word,
			"",
			`❔ ${unused.join(" ") || "—"}`,
			`❌ ${wrong.join(" ") || "—"}`,
			`✅ ${correct.join(" ") || "—"}`,
			"",
			`Wrong guesses: ${this.mistakes}/${maxMistakes} · Type a letter · Esc quits`,
		].join("\n");
	}

	gallows() {
		const diagram = this.won ? gallows[10] : this.mistakes ? gallows[this.mistakes - 1] : "\n\n\n\n\n\n\n";
		return diagram.replace("@", `\u2004${this.face}`).split("\n");
	}

	end(message) {
		const resolve = this.resolve;
		this.resolve = null;
		resolve(message);
	}
}
