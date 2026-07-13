import { Command } from "../../command-system/command.js";

export class Cp extends Command {
	static override names(): readonly string[] {
		return ["cp"];
	}
	static override description(): string {
		return "Copy files.";
	}

	override run(args: readonly string[]): string {
		return this.filesystem.copyOrMove(args, false);
	}
}
