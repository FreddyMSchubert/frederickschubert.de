import { Command } from "../../command-system/command.js";

export class Cd extends Command {
	static command() { return "cd"; }
	static description() { return "Change directory."; }

	async run(args) {
		return this.filesystem.cd(args);
	}
}
