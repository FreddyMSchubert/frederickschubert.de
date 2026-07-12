import { Command } from "../../command-system/command.js";

export class Cd extends Command {
	static names() { return ["cd"]; }
	static description() { return "Change directory."; }

	async run(args) {
		return this.filesystem.cd(args);
	}
}
