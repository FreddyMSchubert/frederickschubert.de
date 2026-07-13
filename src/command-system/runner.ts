import { CommandOutput } from "../terminal/output.js";
import type { Command, CommandConstructor, CommandResult, CommandServices, Completion } from "./command.js";

const interrupted = Symbol("interrupted");

export function splitArguments(line: string): string[] {
	return (
		line.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((argument) => {
			const quote = argument[0];
			return quote === '"' || quote === "'" ? argument.slice(1, -1) : argument;
		}) ?? []
	);
}

export class CommandRunner {
	active: Command | null = null;
	private readonly commandClasses: readonly CommandConstructor[];
	private readonly context: CommandServices;
	private interrupt: (() => void) | null = null;

	constructor(commandClasses: readonly CommandConstructor[], context: CommandServices) {
		this.commandClasses = commandClasses;
		this.context = context;
	}

	async run(line: string): Promise<boolean> {
		if (this.active) return false;

		const [name, ...args] = splitArguments(line);
		if (!name) return true;

		const CommandClass = this.commandClasses.find((command) => command.names().includes(name));
		const output = new CommandOutput(this.context.terminal, this.context.inputLine);
		if (!CommandClass) {
			output.write(`zsh: command not found: ${name}`);
			return true;
		}

		const controller = new AbortController();
		let interrupt = (): void => undefined;
		const interruption = new Promise<typeof interrupted>((resolve) => {
			interrupt = () => {
				resolve(interrupted);
			};
		});
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
			const result: CommandResult | typeof interrupted = await Promise.race([
				this.active.run(args),
				interruption,
			]);
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

	handleInput(event: KeyboardEvent): boolean {
		if (!this.active) return false;
		if (event.ctrlKey && event.key.toLowerCase() === "c") {
			this.interrupt?.();
			return true;
		}
		this.active.handleInput(event);
		return true;
	}

	complete(line: string, cursor: number): Completion | null {
		const before = line.slice(0, cursor);
		if (!before.includes(" ")) {
			const matches = this.commandClasses
				.flatMap((command) => command.names())
				.filter((name) => name.startsWith(before));
			const match = matches.length === 1 ? matches[0] : undefined;
			if (match) return { text: match + line.slice(cursor), cursor: match.length };
		}
		return this.context.filesystem.completePath(line, cursor);
	}
}
