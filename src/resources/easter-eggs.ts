export class EasterEggs {
	private readonly found = new Set<string>();

	find(name: string, messageStart: string): string {
		if (this.found.has(name)) return "you already found this one";

		this.found.add(name);
		return `${messageStart}\nYou found ${this.found.size} easter eggs out of 3.\n${this.found.size === 3 ? "Congrats!" : "Consider yourself challenged."}`;
	}
}
