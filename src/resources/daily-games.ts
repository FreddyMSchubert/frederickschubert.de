export interface DailyGame {
	readonly id: string;
	readonly started: string;
	readonly title: string;
}

export const hangmanGame = { id: "hangman", started: "2026-07-13", title: "Hangman" } as const satisfies DailyGame;
export const wordleGame = { id: "wordle", started: "2026-07-13", title: "Wordle" } as const satisfies DailyGame;
export const dailyGames = [hangmanGame, wordleGame] as const satisfies readonly DailyGame[];

export type GameStatus = "won" | "lost";

type GameHistory = Record<string, GameStatus>;

const storageKey = (game: string): string => `daily-game:${game}`;
const isStatus = (value: unknown): value is GameStatus => value === "won" || value === "lost";

function history(game: string): GameHistory {
	const value = localStorage.getItem(storageKey(game));
	if (!value) return {};

	const legacy = /^(\d{4}-\d{2}-\d{2}):(won|lost)$/.exec(value);
	if (legacy?.[1] && isStatus(legacy[2])) return { [legacy[1]]: legacy[2] };

	try {
		const parsed: unknown = JSON.parse(value);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
		return Object.fromEntries(
			Object.entries(parsed).filter((entry): entry is [string, GameStatus] => isStatus(entry[1])),
		);
	} catch {
		return {};
	}
}

export function localDate(date = new Date()): string {
	return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
		.map((part, index) => part.toString().padStart(index ? 2 : 4, "0"))
		.join("-");
}

export function gameNumber(started: string, date = localDate()): number {
	return Math.floor((Date.parse(date) - Date.parse(started)) / 86_400_000) + 1;
}

export function gameStatus(game: string, date = localDate()): GameStatus | undefined {
	return history(game)[date];
}

export function recordGame(game: string, status: GameStatus, date = localDate()): void {
	localStorage.setItem(storageKey(game), JSON.stringify({ ...history(game), [date]: status }));
}

function previousDate(date: string): string {
	return new Date(Date.parse(date) - 86_400_000).toISOString().slice(0, 10);
}

function streak(date: string, completed: (candidate: string) => boolean): number {
	let candidate = completed(date) ? date : previousDate(date);
	let count = 0;
	while (completed(candidate)) {
		count += 1;
		candidate = previousDate(candidate);
	}
	return count;
}

export function gameStreak(game: DailyGame, date = localDate()): number {
	return streak(date, (candidate) => candidate >= game.started && gameStatus(game.id, candidate) !== undefined);
}

export function completedAllGames(date = localDate()): boolean {
	const available = dailyGames.filter((game) => game.started <= date);
	return available.length > 0 && available.every((game) => gameStatus(game.id, date) !== undefined);
}

export function allGamesStreak(date = localDate()): number {
	return streak(date, completedAllGames);
}

export function pickDailyWord(words: readonly string[], seed: string): string {
	if (!words.length) throw new Error("game: word list is empty");

	let state = 2_166_136_261;
	for (const character of seed) state = Math.imul(state ^ character.charCodeAt(0), 16_777_619);
	const random = (): number => {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
	};

	for (let attempt = 0; attempt < 10; attempt += 1) {
		const word = words[Math.floor(random() * words.length)];
		if (!word) throw new Error("game: word list is empty");
		if (word.length >= 4 || attempt === 9) return word;
	}

	throw new Error("game: word selection failed");
}
