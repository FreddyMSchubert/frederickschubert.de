import { Command } from "../../command-system/command.js";

export class Echo extends Command {
	static names() { return ["echo"]; }
	static description() { return "Print text."; }

	async run(args) {
		return args.join(" ");
	}
}
