import { Command } from "../../command-system/command.js";

export class Mv extends Command {
	static names() { return ["mv"]; }
	static description() { return "Move or rename files and directories."; }

	async run(args) {
		return this.filesystem.copyOrMove(args, true);
	}
}
