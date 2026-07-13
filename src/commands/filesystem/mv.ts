import { Command } from "../../command-system/command.js";

export class Mv extends Command {
	static override names(): readonly string[] {
		return ["mv"];
	}
	static override description(): string {
		return "Move or rename files and directories.";
	}

	override run(args: readonly string[]): string {
		return this.filesystem.copyOrMove(args, true);
	}
}
