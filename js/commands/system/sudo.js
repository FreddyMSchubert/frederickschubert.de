import { Command } from "../../command-system/command.js";

export class Sudo extends Command {
	static command() { return "sudo"; }
	static description() { return "Request administrator privileges."; }

	async run() {
		return this.easterEggs.find("sudo");
	}
}
