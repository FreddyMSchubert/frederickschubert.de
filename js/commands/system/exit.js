import { Command } from "../../command-system/command.js";

export class Exit extends Command {
	static command() { return "exit"; }
	static description() { return "Close the terminal window."; }

	async run() {
		globalThis.close();
	}
}
