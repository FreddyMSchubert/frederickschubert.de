import { Command } from "../../command-system/command.js";

export class Help extends Command {
	static command() { return "help"; }
	static description() { return "Show available commands."; }

	async run() {
		return this.commands.map(command => `${command.command().padEnd(8)} ${command.description()}`).join("\n");
	}
}
