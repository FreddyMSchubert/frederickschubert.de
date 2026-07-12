import { Command } from "../../command-system/command.js";

export class Clear extends Command {
	static names() { return ["clear"]; }
	static description() { return "Clear the terminal."; }

	async run() {
		this.output.clearScreen();
	}
}
