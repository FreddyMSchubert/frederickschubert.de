import { Command } from "../../command-system/command.js";

export class About extends Command {
	static names() { return ["about"]; }
	static description() { return "Print information about this terminal."; }

	async run() {
		const template = document.createElement("template");
		template.innerHTML = this.filesystem.cat(["/usr/share/about.txt"]);
		this.output.write().append(template.content);
	}
}
