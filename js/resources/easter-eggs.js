export class EasterEggs {
	found = new Set();

	find(name, msgStart) {
		if (this.found.has(name)) return "you already found this one";

		this.found.add(name);
		return `${msgStart}\nYou found ${this.found.size} easter eggs out of 3.\n${this.found.size === 3 ? "Congrats!" : "Consider yourself challenged."}`;
	}
}
