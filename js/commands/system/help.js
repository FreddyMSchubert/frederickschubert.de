import { Command } from "../../command-system/command.js";

export class Help extends Command {
	static names() { return ["help", "man"]; }
	static description() { return "Show available commands."; }

	async run() {
		const commands = this.commands
			.map(command => ({ names: command.names().join(", "), description: command.description() }))
			.sort((a, b) => a.names.localeCompare(b.names));
		const width = Math.max(...commands.map(command => command.names.length));
		return commands.map(command => `${command.names.padEnd(width)}  ${command.description}`).join("\n");
	}
}
