export class CommandOutput {
	constructor(terminal, inputLine) {
		this.terminal = terminal;
		this.inputLine = inputLine;
		this.blocks = [];
	}

	write(text = "") {
		const block = document.createElement("span");
		block.className = "terminal-block";
		block.textContent = String(text);
		this.terminal.insertBefore(block, this.inputLine);
		this.blocks.push(block);
		this.terminal.scrollTop = this.terminal.scrollHeight;
		return block;
	}

	removeLast() {
		this.blocks.pop()?.remove();
	}

	replaceLast(text = "") {
		this.removeLast();
		return this.write(text);
	}

	clearScreen() {
		for (const child of [...this.terminal.children]) {
			if (child !== this.inputLine) child.remove();
		}
		this.blocks.length = 0;
	}
}
