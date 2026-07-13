import { Command } from "../../command-system/command.js";

export class Pwd extends Command {
	static override names(): readonly string[] {
		return ["pwd"];
	}
	static override description(): string {
		return "Print working directory.";
	}

	override run(): string {
		return this.filesystem.pwd();
	}
}
