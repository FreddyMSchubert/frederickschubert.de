import { Command } from "../../command-system/command.js";

export class Exit extends Command {
	static override names(): readonly string[] {
		return ["exit"];
	}
	static override description(): string {
		return "Close the terminal window.";
	}

	override run(): undefined {
		globalThis.close();
		return undefined;
	}
}
