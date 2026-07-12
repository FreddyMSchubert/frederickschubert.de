import { Command } from "../../command-system/command.js";

export class Pwd extends Command {
	static command() { return "pwd"; }
	static description() { return "Print working directory."; }

	async run() {
		return this.filesystem.pwd();
	}
}
