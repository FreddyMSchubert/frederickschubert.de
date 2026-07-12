import { Command } from "../../command-system/command.js";

export class Ls extends Command {
	static names() { return ["ls"]; }
	static description() { return "List directory contents."; }

	async run(args) {
		return this.filesystem.ls(args);
	}
}
