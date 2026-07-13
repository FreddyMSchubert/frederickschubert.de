import { mkdir, writeFile } from "node:fs/promises";
import { URL } from "node:url";

const files = [
	{
		name: "hangman.txt",
		source: "https://raw.githubusercontent.com/Xethron/Hangman/master/words.txt",
	},
	{
		name: "wordle-solutions.txt",
		source: "https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt",
	},
	{
		name: "wordle-guesses.txt",
		source: "https://gist.githubusercontent.com/cfreshman/cdcdf777450c5b5301e439061d29694c/raw/wordle-allowed-guesses.txt",
	},
];

const directory = new URL("../assets/game-input/", import.meta.url);
await mkdir(directory, { recursive: true });
await Promise.all(
	files.map(async ({ name, source }) => {
		const response = await globalThis.fetch(source);
		if (!response.ok) throw new Error(`Could not download ${name}: ${response.status}`);
		const contents = await response.text();
		const words = contents.trim().split(/\s+/);
		if (words.length < 100 || words.some((word) => !/^[a-z]+$/i.test(word))) {
			throw new Error(`Could not download ${name}: invalid word list`);
		}
		await writeFile(new URL(name, directory), contents);
	}),
);
