import { commands } from "../command-system/registry.js";
import { CommandRunner } from "../command-system/runner.js";
import { EasterEggs } from "../resources/easter-eggs.js";
import { FileSystem } from "../resources/filesystem.js";
import { CommandOutput } from "./output.js";

function requiredElement(selector: string): HTMLElement {
	const element = document.querySelector<HTMLElement>(selector);
	if (!element) throw new Error(`Missing required element: ${selector}`);
	return element;
}

interface InputState {
	cursor: number;
	history: string[];
	historyDraft: string;
	historyIndex: number;
	text: string;
}

const input = requiredElement("#input");
const inputLine = requiredElement("#input-line");
const prompt = requiredElement(".prompt");
const terminal = requiredElement("#terminal");
const filesystem = new FileSystem();
const easterEggs = new EasterEggs();
const screen = new CommandOutput(terminal, inputLine);
const runner = new CommandRunner(commands, { easterEggs, filesystem, inputLine, terminal });

const inputState: InputState = {
	text: "",
	cursor: 0,
	history: [],
	historyDraft: "",
	historyIndex: 0,
};

let startupLocked = true;
let promptVisible = false;
const konamiCode = [
	"ArrowUp",
	"ArrowUp",
	"ArrowDown",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ArrowLeft",
	"ArrowRight",
	"b",
	"a",
];
let konamiIndex = 0;

const promptText = (): string => `guest@frederickschubert.com:${filesystem.displayPath()}$ `;

function renderInput(): void {
	prompt.textContent = promptText();
	inputLine.hidden = runner.active !== null || !promptVisible;
	inputLine.style.display = inputLine.hidden ? "none" : "";
	if (inputLine.hidden) return;

	const before = inputState.text.slice(0, inputState.cursor);
	const at = inputState.text[inputState.cursor] ?? " ";
	const after = inputState.text.slice(inputState.cursor + 1);
	const cursor = document.createElement("span");
	cursor.className = "cursor";
	cursor.textContent = at === " " ? "\u00a0" : at;
	input.replaceChildren(document.createTextNode(before), cursor, document.createTextNode(after));
}

async function submitCommand(): Promise<void> {
	const line = inputState.text;
	screen.write(promptText() + line);
	if (line && line !== inputState.history.at(-1)) inputState.history.push(line);
	inputState.historyIndex = inputState.history.length;
	inputState.historyDraft = "";
	inputState.text = "";
	inputState.cursor = 0;

	const done = runner.run(line);
	renderInput();
	await done;
	renderInput();
	terminal.scrollTop = terminal.scrollHeight;
}

function completeInput(): boolean {
	const completion = runner.complete(inputState.text, inputState.cursor);
	if (!completion) return false;
	inputState.text = completion.text;
	inputState.cursor = completion.cursor;
	return true;
}

function setInput(text: string): void {
	inputState.text = text;
	inputState.cursor = text.length;
}

function insertInput(text: string): void {
	inputState.text = inputState.text.slice(0, inputState.cursor) + text + inputState.text.slice(inputState.cursor);
	inputState.cursor += text.length;
}

function trackKonami(key: string): { readonly found: boolean; readonly matched: boolean } {
	const normalized = key.length === 1 ? key.toLowerCase() : key;
	const matched = normalized === konamiCode[konamiIndex];
	konamiIndex = matched ? konamiIndex + 1 : Number(normalized === konamiCode[0]);
	if (konamiIndex !== konamiCode.length) return { found: false, matched };

	konamiIndex = 0;
	screen.write(easterEggs.find("konami", "good job"));
	return { found: true, matched };
}

function moveHistory(direction: -1 | 1): boolean {
	if (!inputState.history.length) return false;
	if (inputState.historyIndex === inputState.history.length) inputState.historyDraft = inputState.text;
	inputState.historyIndex = Math.max(0, Math.min(inputState.history.length, inputState.historyIndex + direction));
	setInput(
		inputState.historyIndex === inputState.history.length
			? inputState.historyDraft
			: (inputState.history[inputState.historyIndex] ?? inputState.historyDraft),
	);
	return true;
}

document.addEventListener("keydown", (event) => {
	if (startupLocked) {
		event.preventDefault();
		return;
	}

	if (runner.handleInput(event)) {
		event.preventDefault();
		return;
	}

	const konami = trackKonami(event.key);
	if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
		event.preventDefault();
		screen.clearScreen();
		return;
	}
	if (event.ctrlKey || event.metaKey || (event.altKey && event.key.length !== 1)) return;

	let snapToBottom = false;
	switch (event.key) {
		case "Backspace":
			if (inputState.cursor > 0) {
				inputState.text =
					inputState.text.slice(0, inputState.cursor - 1) + inputState.text.slice(inputState.cursor);
				inputState.cursor--;
				snapToBottom = true;
			}
			break;
		case "Delete":
			inputState.text =
				inputState.text.slice(0, inputState.cursor) + inputState.text.slice(inputState.cursor + 1);
			snapToBottom = true;
			break;
		case "ArrowLeft":
			inputState.cursor = Math.max(0, inputState.cursor - 1);
			break;
		case "ArrowRight":
			inputState.cursor = Math.min(inputState.text.length, inputState.cursor + 1);
			break;
		case "ArrowUp":
			snapToBottom = moveHistory(-1);
			break;
		case "ArrowDown":
			snapToBottom = moveHistory(1);
			break;
		case "Home":
			inputState.cursor = 0;
			break;
		case "End":
			inputState.cursor = inputState.text.length;
			break;
		case "Enter":
			void submitCommand();
			snapToBottom = true;
			break;
		case "Tab":
			snapToBottom = completeInput();
			break;
		default:
			if (!konami.matched && /^[ -~]$/.test(event.key)) {
				insertInput(event.key);
				snapToBottom = true;
			}
	}

	event.preventDefault();
	renderInput();
	if (snapToBottom) terminal.scrollTop = terminal.scrollHeight;
});

requiredElement(".light.close").addEventListener("click", () => void runner.run("exit"));

const progressBar = (percent: number): string => {
	const filled = Math.round(42 * percent);
	return `[${"=".repeat(filled)}${"\u00a0".repeat(42 - filled)}]`;
};

async function runStartupSequence(): Promise<void> {
	screen.write("Booting Freddy OS!");
	screen.write(progressBar(0));
	await new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			resolve();
		});
	});
	screen.replaceLast(progressBar(1));

	promptVisible = true;
	setInput("about");
	renderInput();
	await submitCommand();
	startupLocked = false;
}

renderInput();
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => void runStartupSequence(), { once: true });
} else {
	void runStartupSequence();
}
