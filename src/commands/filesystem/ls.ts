import { Command } from "../../command-system/command.js";

export class Ls extends Command {
	static override names(): readonly string[] {
		return ["ls"];
	}
	static override description(): string {
		return "List directory contents.";
	}

	override run(args: readonly string[]): string {
		return this.filesystem.ls(args);
	}
}
