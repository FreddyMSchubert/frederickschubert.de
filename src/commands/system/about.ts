import { Command } from "../../command-system/command.js";

export class About extends Command {
	static override names(): readonly string[] {
		return ["about"];
	}
	static override description(): string {
		return "Print information about this terminal.";
	}

	override run(): undefined {
		const template = document.createElement("template");
		template.innerHTML = this.filesystem.cat(["/usr/share/about.txt"]);
		this.output.write().append(template.content);
		return undefined;
	}
}
