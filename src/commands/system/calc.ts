import { Command } from "../../command-system/command.js";

interface MathLibrary {
	evaluate(expression: string): unknown;
	format(value: unknown, options: { readonly precision: number }): string;
}

interface MathGlobal {
	readonly math?: MathLibrary;
}

export class Calc extends Command {
	static override names(): readonly string[] {
		return ["calc"];
	}
	static override description(): string {
		return "Evaluate math.";
	}

	override run(args: readonly string[]): string {
		const expression = args.join(" ");
		if (!expression) return "calc: missing expression";
		const mathLibrary = (globalThis as typeof globalThis & MathGlobal).math;
		if (!mathLibrary) return "calc: Math.js failed to load";
		try {
			return mathLibrary.format(mathLibrary.evaluate(expression), { precision: 14 });
		} catch (error) {
			return `calc: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
}
