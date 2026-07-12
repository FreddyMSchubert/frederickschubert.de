import { Command } from "../../command-system/command.js";

export class Touch extends Command {
	static command() { return "touch"; }
	static description() { return "Create files or update their timestamp."; }

	async run(args) {
		return this.filesystem.touch(args);
	}
}
