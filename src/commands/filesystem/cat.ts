import { Command } from "../../command-system/command.js";

export class Cat extends Command {
	static override names(): readonly string[] {
		return ["cat"];
	}
	static override description(): string {
		return "Print file contents.";
	}

	override run(args: readonly string[]): string {
		return this.filesystem.cat(args);
	}
}
