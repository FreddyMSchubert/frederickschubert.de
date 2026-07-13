import { Command } from "../../command-system/command.js";

function jokeText(value: unknown): string | null {
	if (typeof value !== "object" || value === null) return null;
	const joke = value as Record<string, unknown>;
	if (joke["type"] === "twopart" && typeof joke["setup"] === "string" && typeof joke["delivery"] === "string") {
		return `${joke["setup"]}\n${joke["delivery"]}`;
	}
	return typeof joke["joke"] === "string" ? joke["joke"] : null;
}

export class Joke extends Command {
	static override names(): readonly string[] {
		return ["joke"];
	}
	static override description(): string {
		return "Fetch a joke from JokeAPI.";
	}

	override async run(): Promise<string> {
		try {
			const response = await fetch("https://v2.jokeapi.dev/joke/Any?safe-mode", { signal: this.signal });
			if (!response.ok) return `joke: request failed (${response.status})`;
			const joke: unknown = await response.json();
			return jokeText(joke) ?? "joke: invalid response";
		} catch {
			return "joke: request failed";
		}
	}
}
