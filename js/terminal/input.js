import { commands } from "../command-system/registry.js";
import { CommandRunner } from "../command-system/runner.js";
import { EasterEggs } from "../resources/easter-eggs.js";
import { FileSystem } from "../resources/filesystem.js";
import { CommandOutput } from "./output.js";

const input = document.getElementById("input");
const inputLine = document.getElementById("input-line");
const prompt = document.querySelector(".prompt");
const terminal = document.getElementById("terminal");
const filesystem = new FileSystem();
const easterEggs = new EasterEggs();
const screen = new CommandOutput(terminal, inputLine);
const runner = new CommandRunner(commands, { easterEggs, filesystem, inputLine, terminal });

const inputState = {
	text: "",
	cursor: 0,
	history: [],
	historyDraft: "",
	historyIndex: 0,
};

let startupLocked = true;
let promptVisible = false;
const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konamiIndex = 0;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const promptText = () => `guest@frederickschubert.com:${filesystem.displayPath()}$ `;

function renderInput() {
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

async function submitCommand() {
	const line = inputState.text;
	const history = screen.write(promptText() + line);
	if (line && line !== inputState.history.at(-1)) inputState.history.push(line);
	inputState.historyIndex = inputState.history.length;
	inputState.historyDraft = "";
	inputState.text = "";
	inputState.cursor = 0;

	const done = runner.run(line);
	history.hidden = runner.active !== null;
	history.style.display = history.hidden ? "none" : "";
	renderInput();
	await done;
	history.hidden = false;
	history.style.display = "";
	renderInput();
	terminal.scrollTop = terminal.scrollHeight;
}

function completeInput() {
	const completion = runner.complete(inputState.text, inputState.cursor);
	if (!completion) return false;
	inputState.text = completion.text;
	inputState.cursor = completion.cursor;
	return true;
}

function setInput(text) {
	inputState.text = text;
	inputState.cursor = text.length;
}

function insertInput(text) {
	inputState.text = inputState.text.slice(0, inputState.cursor) + text + inputState.text.slice(inputState.cursor);
	inputState.cursor += text.length;
}

function trackKonami(key) {
	const normalized = key.length === 1 ? key.toLowerCase() : key;
	const matched = normalized === konamiCode[konamiIndex];
	konamiIndex = matched ? konamiIndex + 1 : Number(normalized === konamiCode[0]);
	if (konamiIndex !== konamiCode.length) return { found: false, matched };

	konamiIndex = 0;
	screen.write(easterEggs.find("konami"));
	return { found: true, matched };
}

function moveHistory(direction) {
	if (!inputState.history.length) return false;
	if (inputState.historyIndex === inputState.history.length) inputState.historyDraft = inputState.text;
	inputState.historyIndex = Math.max(0, Math.min(inputState.history.length, inputState.historyIndex + direction));
	setInput(inputState.historyIndex === inputState.history.length ? inputState.historyDraft : inputState.history[inputState.historyIndex]);
	return true;
}

document.addEventListener("keydown", event => {
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
				inputState.text = inputState.text.slice(0, inputState.cursor - 1) + inputState.text.slice(inputState.cursor);
				inputState.cursor--;
				snapToBottom = true;
			}
			break;
		case "Delete":
			inputState.text = inputState.text.slice(0, inputState.cursor) + inputState.text.slice(inputState.cursor + 1);
			snapToBottom = true;
			break;
		case "ArrowLeft": inputState.cursor = Math.max(0, inputState.cursor - 1); break;
		case "ArrowRight": inputState.cursor = Math.min(inputState.text.length, inputState.cursor + 1); break;
		case "ArrowUp": snapToBottom = moveHistory(-1); break;
		case "ArrowDown": snapToBottom = moveHistory(1); break;
		case "Home": inputState.cursor = 0; break;
		case "End": inputState.cursor = inputState.text.length; break;
		case "Enter": void submitCommand(); snapToBottom = true; break;
		case "Tab": snapToBottom = completeInput(); break;
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

document.querySelector(".light.close").addEventListener("click", () => void runner.run("exit"));

const progressBar = percent => {
	const filled = Math.round(42 * percent);
	return `[${"=".repeat(filled)}${"\u00a0".repeat(42 - filled)}]`;
};

async function fillProgress(from, to, duration) {
	const started = performance.now();
	while (true) {
		const progress = Math.min(1, (performance.now() - started) / duration);
		screen.replaceLast(progressBar(from + (to - from) * progress));
		if (progress === 1) return;
		await sleep(16);
	}
}

async function runStartupSequence() {
	screen.write("Booting Freddy OS!");
	await sleep(500);
	screen.write(progressBar(0));
	await fillProgress(0, 39 / 42, 1000);
	for (let filled = 40; filled <= 42; filled++) {
		await sleep(420);
		screen.replaceLast(progressBar(filled / 42));
	}

	promptVisible = true;
	renderInput();
	await sleep(500);
	for (const key of "about") {
		await sleep(250);
		insertInput(key);
		renderInput();
	}
	await sleep(250);
	await submitCommand();
	startupLocked = false;
}

renderInput();
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", runStartupSequence, { once: true });
else runStartupSequence();
