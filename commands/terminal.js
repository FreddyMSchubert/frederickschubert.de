function clearTerminal() {
	const terminal = document.getElementById("terminal");

	while (terminal.firstElementChild !== terminal.lastElementChild) {
		terminal.firstElementChild.remove();
	}

	return "";
}

TerminalCommands.register("clear", "Clear the terminal.", clearTerminal);
TerminalCommands.register("exit", "Close the terminal window.", () => window.close() ?? "");

TerminalCommands.register("echo", "Print text.", args => args.join(" "));
TerminalCommands.register("sudo", "Request administrator privileges.", () => "nice try");

TerminalCommands.register("joke", "Fetch a joke from JokeAPI.", async () => {
	try {
		const response = await fetch("https://v2.jokeapi.dev/joke/Any?safe-mode");
		if (!response.ok) return `joke: request failed (${response.status})`;

		const joke = await response.json();
		return joke.type === "twopart" ? `${joke.setup}\n${joke.delivery}` : joke.joke;
	} catch {
		return "joke: request failed";
	}
});

TerminalCommands.register("calc", "Evaluate math with Math.js.", args => {
	const expression = args.join(" ");
	if (!expression) return "calc: missing expression";
	if (!globalThis.math) return "calc: Math.js failed to load";

	try {
		return math.format(math.evaluate(expression), { precision: 14 });
	} catch (error) {
		return `calc: ${error.message}`;
	}
});

const TerminalUi = { clear: clearTerminal };
