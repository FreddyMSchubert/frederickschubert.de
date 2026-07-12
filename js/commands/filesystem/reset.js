import { Command } from "../../command-system/command.js";

export class Reset extends Command {
	static names() { return ["reset"]; }
	static description() { return "Reset the fake filesystem."; }

	async run() {
		return this.filesystem.reset();
	}
}
