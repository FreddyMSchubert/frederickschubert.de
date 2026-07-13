import { Command } from "../../command-system/command.js";

export class Touch extends Command {
	static override names(): readonly string[] {
		return ["touch"];
	}
	static override description(): string {
		return "Create files or update their timestamp.";
	}

	override run(args: readonly string[]): string {
		return this.filesystem.touch(args);
	}
}
