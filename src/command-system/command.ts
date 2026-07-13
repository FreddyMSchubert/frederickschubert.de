import type { EasterEggs } from "../resources/easter-eggs.js";
import type { FileSystem } from "../resources/filesystem.js";
import type { CommandOutput } from "../terminal/output.js";

export interface Completion {
	readonly cursor: number;
	readonly text: string;
}

export interface CommandServices {
	readonly easterEggs: EasterEggs;
	readonly filesystem: FileSystem;
	readonly inputLine: HTMLElement;
	readonly terminal: HTMLElement;
}

export interface CommandContext extends CommandServices {
	readonly commands: readonly CommandConstructor[];
	readonly output: CommandOutput;
	readonly signal: AbortSignal;
}

export type CommandResult = string | undefined;

export interface CommandConstructor {
	new (context: CommandContext): Command;
	readonly name: string;
	description(): string;
	names(): readonly string[];
}

export class Command {
	readonly commands: readonly CommandConstructor[];
	readonly easterEggs: EasterEggs;
	readonly filesystem: FileSystem;
	readonly inputLine: HTMLElement;
	readonly output: CommandOutput;
	readonly signal: AbortSignal;
	readonly terminal: HTMLElement;

	static names(): readonly string[] {
		throw new TypeError(`${this.name} must implement static names()`);
	}

	static description(): string {
		throw new TypeError(`${this.name} must implement static description()`);
	}

	constructor(context: CommandContext) {
		this.commands = context.commands;
		this.easterEggs = context.easterEggs;
		this.filesystem = context.filesystem;
		this.inputLine = context.inputLine;
		this.output = context.output;
		this.signal = context.signal;
		this.terminal = context.terminal;
	}

	run(_args: readonly string[]): CommandResult | Promise<CommandResult> {
		void _args;
		return undefined;
	}

	handleInput(_event: KeyboardEvent): void {
		void _event;
	}
}
