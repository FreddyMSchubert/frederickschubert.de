import { Command } from "../../command-system/command.js";

let wordList: readonly string[] | undefined;

const alphabet = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const maxMistakes = 10;
const stressedFaces = Array.from("😶😣😥😮😫😪😯🤐😔😲☹😖😞😟😤😢😭😦😧😨😩😬🥶🥵😱😰😳🤕🤬😡😠🥺");
const deadFaces = Array.from("💀☠👻");
const winningFaces = Array.from("😀😁😃😄😅😆😉😊😎🙂😇🥳🧐");

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
	private face = "";
	private guessed = new Set<string>();
	private resolve: ((message: string) => void) | null = null;
	private won = false;
	private word = "";

	static override names(): readonly string[] {
		return ["hangman"];
	}
	static override description(): string {
		return "Play a game of hangman.";
	}

	override async run(): Promise<string> {
		this.word = this.pickWord(await this.loadWords());
		this.guessed = new Set<string>();
		this.won = false;
		this.face = this.pickFace(stressedFaces);
		this.output.write(this.frame());
		return new Promise<string>((resolve) => {
			this.resolve = resolve;
		});
	}

	private async loadWords(): Promise<readonly string[]> {
		if (wordList) return wordList;
		const response = await fetch(new URL("../../../assets/hangman.txt", import.meta.url), { signal: this.signal });
		if (!response.ok) throw new Error("hangman: word list unavailable; run npm run build");
		wordList = (await response.text()).trim().split(/\s+/);
		return wordList;
	}

	private pickWord(words: readonly string[]): string {
		const word = words[Math.floor(Math.random() * words.length)];
		if (!word) throw new Error("hangman: word list is empty");
		return word;
	}

	private pickFace(faces: readonly string[]): string {
		const choices = faces.filter((face) => face !== this.face);
		return choices[Math.floor(Math.random() * choices.length)] ?? "";
	}

	override handleInput(event: KeyboardEvent): void {
		if (!this.resolve) return;
		if (event.key === "Escape") {
			this.end(`Game quit. The word was ${this.word.toUpperCase()}.`);
			return;
		}

		const letter = event.key.toLowerCase();
		if (!/^[a-z]$/.test(letter) || this.guessed.has(letter)) return;
		this.guessed.add(letter);
		const won = Array.from(this.word).every((character) => this.guessed.has(character));
		const lost = !won && this.mistakes === maxMistakes;
		this.won = won;
		this.face = this.pickFace(won ? winningFaces : lost ? deadFaces : stressedFaces);
		this.output.replaceLast(this.frame());

		if (won) this.end(`You won! The word was ${this.word.toUpperCase()}. Congratulations!`);
		else if (lost) this.end(`You lost. The word was ${this.word.toUpperCase()}. Better luck next time!`);
	}

	private get mistakes(): number {
		return [...this.guessed].filter((letter) => !this.word.includes(letter)).length;
	}

	private frame(): string {
		const word = Array.from(this.word)
			.map((letter) => (this.guessed.has(letter) ? letter.toUpperCase() : "_"))
			.join(" ");
		const unused = alphabet.filter((letter) => !this.guessed.has(letter.toLowerCase()));
		const wrong = alphabet.filter(
			(letter) => this.guessed.has(letter.toLowerCase()) && !this.word.includes(letter.toLowerCase()),
		);
		const correct = alphabet.filter(
			(letter) => this.guessed.has(letter.toLowerCase()) && this.word.includes(letter.toLowerCase()),
		);

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

	private gallows(): string[] {
		const diagram = (this.won ? gallows[10] : this.mistakes ? gallows[this.mistakes - 1] : "\n\n\n\n\n\n\n") ?? "";
		return diagram.replace("@", `\u2004${this.face}`).split("\n");
	}

	private end(message: string): void {
		const resolve = this.resolve;
		this.resolve = null;
		resolve?.(message);
	}
}
