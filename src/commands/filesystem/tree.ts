import { Command } from "../../command-system/command.js";

export class Tree extends Command {
	static override names(): readonly string[] {
		return ["tree"];
	}
	static override description(): string {
		return "Print files as a tree.";
	}

	override run(args: readonly string[]): string {
		return this.filesystem.tree(args);
	}
}
