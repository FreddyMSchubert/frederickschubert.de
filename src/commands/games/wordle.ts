import { Command } from "../../command-system/command.js";
import {
	gameNumber,
	gameStatus,
	localDate,
	pickDailyWord,
	recordGame,
	wordleGame,
} from "../../resources/daily-games.js";

type LetterScore = "absent" | "present" | "correct";

function scoreGuess(guess: string, solution: string): readonly LetterScore[] {
	const scores: LetterScore[] = Array.from({ length: solution.length }, () => "absent");
	const remaining = new Map<string, number>();

	for (let index = 0; index < solution.length; index += 1) {
		const answer = solution[index];
		if (guess[index] === answer) scores[index] = "correct";
		else if (answer) remaining.set(answer, (remaining.get(answer) ?? 0) + 1);
	}

	for (let index = 0; index < guess.length; index += 1) {
		if (scores[index] === "correct") continue;
		const letter = guess[index];
		const count = letter ? (remaining.get(letter) ?? 0) : 0;
		if (letter && count > 0) {
			scores[index] = "present";
			remaining.set(letter, count - 1);
		}
	}

	return scores;
}

interface SubmittedGuess {
	readonly scores: readonly LetterScore[];
	readonly word: string;
}

interface WordLists {
	readonly allowed: ReadonlySet<string>;
	readonly solutions: readonly string[];
}

const wordLength = 5;
const maxGuesses = 6;
let wordLists: WordLists | undefined;

const parseWords = (text: string): string[] =>
	text
		.toLowerCase()
		.split(/\s+/)
		.filter((word) => /^[a-z]{5}$/.test(word));

export class Wordle extends Command {
	private allowed: ReadonlySet<string> = new Set();
	private board: HTMLElement | null = null;
	private current = "";
	private date = "";
	private guesses: SubmittedGuess[] = [];
	private message = "";
	private resolve: ((message: string) => void) | null = null;
	private solution = "";

	static override names(): readonly string[] {
		return ["wordle"];
	}
	static override description(): string {
		return "Play today's Wordle.";
	}

	override async run(): Promise<string> {
		this.date = localDate();
		const status = gameStatus(wordleGame.id, this.date);
		if (status) return `${this.heading()}\n\nWordle already ${status} today. Come back tomorrow.`;

		const lists = await this.loadWords();
		this.solution = pickDailyWord(lists.solutions, this.date);
		this.allowed = lists.allowed;
		recordGame(wordleGame.id, "lost", this.date);
		this.board = this.output.write();
		this.board.classList.add("wordle");
		this.render();
		return new Promise<string>((resolve) => {
			this.resolve = resolve;
		});
	}

	override handleInput(event: KeyboardEvent): void {
		if (!this.resolve) return;
		if (event.key === "Escape") {
			this.end(`Game quit. The word was ${this.solution.toUpperCase()}.`);
		} else if (event.key === "Backspace") {
			this.current = this.current.slice(0, -1);
			this.message = "";
			this.render();
		} else if (event.key === "Enter") {
			this.submit();
		} else if (/^[a-z]$/i.test(event.key) && this.current.length < wordLength) {
			this.current += event.key.toLowerCase();
			this.message = "";
			this.render();
		}
	}

	private async loadWords(): Promise<WordLists> {
		if (wordLists) return wordLists;
		const [solutionsResponse, guessesResponse] = await Promise.all([
			fetch(new URL("../../../assets/game-input/wordle-solutions.txt", import.meta.url), {
				signal: this.signal,
			}),
			fetch(new URL("../../../assets/game-input/wordle-guesses.txt", import.meta.url), {
				signal: this.signal,
			}),
		]);
		if (
			!solutionsResponse.ok ||
			!guessesResponse.ok ||
			!solutionsResponse.headers.get("content-type")?.startsWith("text/plain") ||
			!guessesResponse.headers.get("content-type")?.startsWith("text/plain")
		) {
			throw new Error("wordle: word lists unavailable");
		}
		const solutions = parseWords(await solutionsResponse.text());
		const guesses = parseWords(await guessesResponse.text());
		if (!solutions.length || !guesses.length) throw new Error("wordle: word lists are empty");
		wordLists = { allowed: new Set([...solutions, ...guesses]), solutions };
		return wordLists;
	}

	private submit(): void {
		if (this.current.length < wordLength) {
			this.message = "Not enough letters.";
			this.render();
			return;
		}
		if (!this.allowed.has(this.current)) {
			this.message = "Not in the word list.";
			this.render();
			return;
		}

		const word = this.current;
		this.current = "";
		this.message = "";
		this.guesses.push({ scores: scoreGuess(word, this.solution), word });
		this.render();

		if (word === this.solution) {
			recordGame(wordleGame.id, "won", this.date);
			this.end(`You won in ${this.guesses.length}/${maxGuesses}!`);
		} else if (this.guesses.length === maxGuesses) {
			this.end(`You lost. The word was ${this.solution.toUpperCase()}.`);
		}
	}

	private render(): void {
		if (!this.board) return;
		const heading = document.createElement("span");
		heading.className = "wordle-heading";
		heading.textContent = this.heading();

		const grid = document.createElement("span");
		grid.className = "wordle-grid";
		grid.setAttribute("role", "grid");
		grid.setAttribute("aria-label", "Wordle guesses");
		for (let rowIndex = 0; rowIndex < maxGuesses; rowIndex += 1) {
			const submitted = this.guesses[rowIndex];
			const word = submitted?.word ?? (rowIndex === this.guesses.length ? this.current : "");
			const row = document.createElement("span");
			row.className = "wordle-row";
			row.setAttribute("role", "row");
			for (let column = 0; column < wordLength; column += 1) {
				const tile = document.createElement("span");
				tile.className = "wordle-tile";
				tile.setAttribute("role", "gridcell");
				const letter = word[column]?.toUpperCase() ?? "";
				tile.textContent = letter || "\u00a0";
				tile.setAttribute("aria-label", letter || "empty");
				const score = submitted?.scores[column];
				if (score) tile.classList.add(`wordle-${score}`);
				row.append(tile);
			}
			grid.append(row);
		}

		const message = document.createElement("span");
		message.className = "wordle-message";
		message.textContent = this.message;
		const instructions = document.createElement("span");
		instructions.className = "wordle-instructions";
		instructions.textContent = "Type letters · Backspace edits · Enter submits · Esc quits";
		this.board.replaceChildren(heading, grid, message, instructions);
	}

	private heading(): string {
		return `Wordle #${gameNumber(wordleGame.started, this.date)} — ${this.date}`;
	}

	private end(message: string): void {
		const resolve = this.resolve;
		this.resolve = null;
		resolve?.(message);
	}
}
