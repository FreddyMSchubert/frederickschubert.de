import { Command } from "../../command-system/command.js";

export class Cat extends Command {
	static command() { return "cat"; }
	static description() { return "Print file contents."; }

	async run(args) {
		return this.filesystem.cat(args);
	}
}
