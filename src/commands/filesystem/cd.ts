import { Command } from "../../command-system/command.js";

export class Cd extends Command {
	static override names(): readonly string[] {
		return ["cd"];
	}
	static override description(): string {
		return "Change directory.";
	}

	override run(args: readonly string[]): string {
		return this.filesystem.cd(args);
	}
}
