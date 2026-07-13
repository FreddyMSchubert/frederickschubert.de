import { Command } from "../../command-system/command.js";

export class Mkdir extends Command {
	static override names(): readonly string[] {
		return ["mkdir"];
	}
	static override description(): string {
		return "Create directories.";
	}

	override run(args: readonly string[]): string {
		return this.filesystem.mkdir(args);
	}
}
