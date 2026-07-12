import { Command } from "../../command-system/command.js";

export class Joke extends Command {
	static command() { return "joke"; }
	static description() { return "Fetch a joke from JokeAPI."; }

	async run() {
		try {
			const response = await fetch("https://v2.jokeapi.dev/joke/Any?safe-mode", { signal: this.signal });
			if (!response.ok) return `joke: request failed (${response.status})`;
			const joke = await response.json();
			return joke.type === "twopart" ? `${joke.setup}\n${joke.delivery}` : joke.joke;
		} catch {
			return "joke: request failed";
		}
	}
}
