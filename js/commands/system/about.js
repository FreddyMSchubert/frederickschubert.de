import { Command } from "../../command-system/command.js";

export class About extends Command {
	static command() { return "about"; }
	static description() { return "Print information about this terminal."; }

	async run() {
		return this.filesystem.cat(["/usr/share/about.txt"]);
	}
}
