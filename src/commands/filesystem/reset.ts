import { Command } from "../../command-system/command.js";

export class Reset extends Command {
	static override names(): readonly string[] {
		return ["reset"];
	}
	static override description(): string {
		return "Reset the fake filesystem.";
	}

	override run(): string {
		return this.filesystem.reset();
	}
}
