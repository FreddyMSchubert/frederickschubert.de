import { Command } from "../../command-system/command.js";

export class Tree extends Command {
	static names() { return ["tree"]; }
	static description() { return "Print files as a tree."; }

	async run(args) {
		return this.filesystem.tree(args);
	}
}
