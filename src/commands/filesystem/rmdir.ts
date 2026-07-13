import { Command } from "../../command-system/command.js";

export class Rmdir extends Command {
	static override names(): readonly string[] {
		return ["rmdir"];
	}
	static override description(): string {
		return "Remove empty directories.";
	}

	override run(args: readonly string[]): string {
		return this.filesystem.rmdir(args);
	}
}
