import { Command } from "../../command-system/command.js";

export class Clear extends Command {
	static override names(): readonly string[] {
		return ["clear"];
	}
	static override description(): string {
		return "Clear the terminal.";
	}

	override run(): undefined {
		this.output.clearScreen();
		return undefined;
	}
}
