export class CommandOutput {
	private readonly blocks: HTMLElement[] = [];
	private readonly inputLine: HTMLElement;
	private readonly terminal: HTMLElement;

	constructor(terminal: HTMLElement, inputLine: HTMLElement) {
		this.terminal = terminal;
		this.inputLine = inputLine;
	}

	write(text = ""): HTMLElement {
		const block = document.createElement("span");
		block.className = "terminal-block";
		block.textContent = text;
		this.terminal.insertBefore(block, this.inputLine);
		this.blocks.push(block);
		this.terminal.scrollTop = this.terminal.scrollHeight;
		return block;
	}

	removeLast(): void {
		this.blocks.pop()?.remove();
	}

	replaceLast(text = ""): HTMLElement {
		this.removeLast();
		return this.write(text);
	}

	clearScreen(): void {
		for (const child of [...this.terminal.children]) {
			if (child !== this.inputLine) child.remove();
		}
		this.blocks.length = 0;
	}
}
