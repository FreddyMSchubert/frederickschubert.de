import { Command } from "../../command-system/command.js";

export class Cp extends Command {
	static command() { return "cp"; }
	static description() { return "Copy files. Use -R for directories."; }

	async run(args) {
		return this.filesystem.copyOrMove(args, false);
	}
}
