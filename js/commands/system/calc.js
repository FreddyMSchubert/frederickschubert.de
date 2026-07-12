import { Command } from "../../command-system/command.js";

export class Calc extends Command {
	static command() { return "calc"; }
	static description() { return "Evaluate math with Math.js."; }

	async run(args) {
		const expression = args.join(" ");
		if (!expression) return "calc: missing expression";
		if (!globalThis.math) return "calc: Math.js failed to load";
		try {
			return math.format(math.evaluate(expression), { precision: 14 });
		} catch (error) {
			return `calc: ${error.message}`;
		}
	}
}
