import { Command } from "../../command-system/command.js";

export class Rmdir extends Command {
	static command() { return "rmdir"; }
	static description() { return "Remove empty directories."; }

	async run(args) {
		return this.filesystem.rmdir(args);
	}
}
