const input = document.getElementById("input");
const terminal = document.getElementById("terminal");
const closeButton = document.querySelector(".light.close");

const inputState = {
	text: "",
	cursor: 0,
	history: [],
	historyDraft: "",
	historyIndex: 0,
};
let commandRunning = false;
let startupLocked = true;
let promptVisible = false;
const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konamiIndex = 0;

function promptText() {
	return `guest@frederickschubert.com:${TerminalFilesystem.displayPath()}$ `;
}

function print(text = "") {
	const line = document.createElement("div");
	line.textContent = text;
	terminal.insertBefore(line, terminal.lastElementChild);
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function submitCommand() {
	const line = inputState.text;
	const history = document.createElement("div");
	history.append(document.createTextNode(promptText() + line));
	terminal.insertBefore(history, terminal.lastElementChild);
	if (line && line !== inputState.history.at(-1)) inputState.history.push(line);
	inputState.historyIndex = inputState.history.length;
	inputState.historyDraft = "";
	inputState.text = "";
	inputState.cursor = 0;
	commandRunning = true;
	renderCustomInput();

	try {
		const output = await TerminalCommands.run(line).catch(error => error.message);
		if (output) output.split("\n").forEach(print);
	} finally {
		commandRunning = false;
		renderCustomInput();
	}

	terminal.scrollTop = terminal.scrollHeight;
}

function completeInput() {
	const completion = TerminalCommands.complete(inputState.text, inputState.cursor);
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
	inputState.text =
		inputState.text.slice(0, inputState.cursor) +
		text +
		inputState.text.slice(inputState.cursor);
	inputState.cursor += text.length;
}

function trackKonami(key) {
	const normalized = key.length === 1 ? key.toLowerCase() : key;
	const matched = normalized === konamiCode[konamiIndex];
	konamiIndex = matched ? konamiIndex + 1 : Number(normalized === konamiCode[0]);
	if (konamiIndex !== konamiCode.length) return { found: false, matched };

	konamiIndex = 0;
	TerminalCommands.findEasterEgg("konami").split("\n").forEach(print);
	terminal.scrollTop = terminal.scrollHeight;
	return { found: true, matched };
}

function moveHistory(direction) {
	if (!inputState.history.length) return false;

	if (inputState.historyIndex === inputState.history.length) {
		inputState.historyDraft = inputState.text;
	}

	inputState.historyIndex = Math.max(0, Math.min(inputState.history.length, inputState.historyIndex + direction));
	setInput(inputState.historyIndex === inputState.history.length ? inputState.historyDraft : inputState.history[inputState.historyIndex]);
	return true;
}

function renderCustomInput() {
	const prompt = document.querySelector(".prompt");
	prompt.textContent = promptText();
	prompt.hidden = commandRunning || !promptVisible;
	input.hidden = commandRunning || !promptVisible;
	if (commandRunning || !promptVisible) {
		return;
	}

	const before = inputState.text.slice(0, inputState.cursor);
	const at = inputState.text[inputState.cursor] ?? " ";
	const after = inputState.text.slice(inputState.cursor + 1);

	input.innerHTML = "";

	input.append(document.createTextNode(before));

	const cursor = document.createElement("span");
	cursor.className = "cursor";
	cursor.textContent = at === " " ? "\u00a0" : at;
	input.append(cursor);

	input.append(document.createTextNode(after));
}

document.addEventListener("keydown", event => {
	if (startupLocked) {
		event.preventDefault();
		return;
	}

	const konami = trackKonami(event.key);

	if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
		event.preventDefault();
		TerminalUi.clear();
		return;
	}

	if (event.ctrlKey || event.metaKey || (event.altKey && event.key.length !== 1)) return;
	let snapToBottom = false;

	switch (event.key) {
		case "Backspace":
			if (inputState.cursor > 0) {
				inputState.text =
				inputState.text.slice(0, inputState.cursor - 1) +
				inputState.text.slice(inputState.cursor);

				inputState.cursor--;
				snapToBottom = true;
			}
			break;

		case "Delete":
			inputState.text =
				inputState.text.slice(0, inputState.cursor) +
				inputState.text.slice(inputState.cursor + 1);
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
			if (commandRunning) break;
			submitCommand();
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
	renderCustomInput();
	if (snapToBottom) terminal.scrollTop = terminal.scrollHeight;
});

closeButton.addEventListener("click", () => TerminalCommands.run("exit"));

renderCustomInput();

function progressBar(percent) {
	const filled = Math.round(42 * percent);
	return `[${"=".repeat(filled)}${"\u00a0".repeat(42 - filled)}]`;
}

async function fillProgress(line, from, to, duration) {
	const started = performance.now();

	while (true) {
		const elapsed = performance.now() - started;
		const progress = Math.min(1, elapsed / duration);
		line.textContent = progressBar(from + (to - from) * progress);
		if (progress === 1) return;
		await sleep(16);
	}
}

async function runStartupSequence() {
	const bootLine = document.createElement("div");
	bootLine.textContent = "Booting Freddy OS!";
	terminal.insertBefore(bootLine, terminal.lastElementChild);

	await sleep(500);

	const progressLine = document.createElement("div");
	progressLine.textContent = progressBar(0);
	terminal.insertBefore(progressLine, terminal.lastElementChild);

	await fillProgress(progressLine, 0, 39 / 42, 1000);
	for (let filled = 40; filled <= 42; filled++) {
		await sleep(420);
		progressLine.textContent = progressBar(filled / 42);
	}

	promptVisible = true;
	renderCustomInput();

	await sleep(500);
	for (const key of "about") {
		await sleep(250);
		insertInput(key);
		renderCustomInput();
	}

	await sleep(250);
	await submitCommand();
	startupLocked = false;
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", runStartupSequence, { once: true });
} else {
	runStartupSequence();
}
