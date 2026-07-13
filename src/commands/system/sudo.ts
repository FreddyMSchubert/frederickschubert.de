import { Command } from "../../command-system/command.js";

export class Sudo extends Command {
	static override names(): readonly string[] {
		return ["sudo"];
	}
	static override description(): string {
		return "Request administrator privileges.";
	}

	override run(): string {
		return this.easterEggs.find("sudo", "nice try");
	}
}
