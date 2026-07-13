import { Command } from "../../command-system/command.js";

export class Rm extends Command {
	static override names(): readonly string[] {
		return ["rm"];
	}
	static override description(): string {
		return "Remove files or directories.";
	}

	override run(args: readonly string[]): string {
		const flags = args.filter((argument) => argument.startsWith("-")).join("");
		const paths = args.filter((argument) => !argument.startsWith("-"));
		if (paths.includes("/") && flags.includes("f") && (flags.includes("r") || flags.includes("R"))) {
			return this.easterEggs.find(
				"rm-root",
				"hey now, we might still need the french language pack in the future",
			);
		}
		return this.filesystem.rm(args);
	}
}
