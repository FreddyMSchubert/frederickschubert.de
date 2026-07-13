import { Command } from "../../command-system/command.js";

export class Echo extends Command {
	static override names(): readonly string[] {
		return ["echo"];
	}
	static override description(): string {
		return "Print text.";
	}

	override run(args: readonly string[]): string {
		return args.join(" ");
	}
}
