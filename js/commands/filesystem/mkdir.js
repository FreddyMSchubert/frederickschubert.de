import { Command } from "../../command-system/command.js";

export class Mkdir extends Command {
	static names() { return ["mkdir"]; }
	static description() { return "Create directories."; }

	async run(args) {
		return this.filesystem.mkdir(args);
	}
}
