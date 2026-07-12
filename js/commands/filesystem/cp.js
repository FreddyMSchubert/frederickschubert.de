import { Command } from "../../command-system/command.js";

export class Cp extends Command {
	static names() { return ["cp"]; }
	static description() { return "Copy files."; }

	async run(args) {
		return this.filesystem.copyOrMove(args, false);
	}
}
