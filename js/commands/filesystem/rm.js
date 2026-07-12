import { Command } from "../../command-system/command.js";

export class Rm extends Command {
	static names() { return ["rm"]; }
	static description() { return "Remove files or directories."; }

	async run(args) {
		const flags = args.filter(arg => arg.startsWith("-")).join("");
		const paths = args.filter(arg => !arg.startsWith("-"));
		if (paths.includes("/") && flags.includes("f") && (flags.includes("r") || flags.includes("R"))) {
			return this.easterEggs.find("rm-root", "hey now, we might still need the french language pack in the future");
		}
		return this.filesystem.rm(args);
	}
}
