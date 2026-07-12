import { CommandOutput } from "../terminal/output.js";

const interrupted = Symbol("interrupted");

export function splitArguments(line) {
	return line.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map(argument => {
		const quote = argument[0];
		return quote === "\"" || quote === "'" ? argument.slice(1, -1) : argument;
	}) ?? [];
}

export class CommandRunner {
	constructor(commandClasses, context) {
		this.commandClasses = commandClasses;
		this.context = context;
		this.active = null;
	}

	async run(line) {
		if (this.active) return false;

		const [name, ...args] = splitArguments(line);
		if (!name) return true;

		const CommandClass = this.commandClasses.find(command => command.command() === name);
		const output = new CommandOutput(this.context.terminal, this.context.inputLine);
		if (!CommandClass) {
			output.write(`zsh: command not found: ${name}`);
			return true;
		}

		const controller = new AbortController();
		let interrupt;
		const interruption = new Promise(resolve => { interrupt = () => resolve(interrupted); });
		this.interrupt = () => {
			controller.abort();
			interrupt();
		};
		this.active = new CommandClass({
			...this.context,
			commands: this.commandClasses,
			output,
			signal: controller.signal,
		});

		try {
			const result = await Promise.race([this.active.run(args), interruption]);
			if (result === interrupted) output.write("^C");
			else if (result !== undefined && result !== "") output.write(result);
		} catch (error) {
			output.write(error instanceof Error ? error.message : String(error));
		} finally {
			this.active = null;
			this.interrupt = null;
		}

		return true;
	}

	handleInput(event) {
		if (!this.active) return false;
		if (event.ctrlKey && event.key.toLowerCase() === "c") {
			this.interrupt();
			return true;
		}
		this.active.handleInput(event);
		return true;
	}

	complete(line, cursor) {
		const before = line.slice(0, cursor);
		if (!before.includes(" ")) {
			const matches = this.commandClasses.map(command => command.command()).filter(name => name.startsWith(before));
			if (matches.length === 1) return { text: matches[0] + line.slice(cursor), cursor: matches[0].length };
		}
		return this.context.filesystem.completePath(line, cursor);
	}
}
