const TerminalCommands = (() => {
	const commands = [];
	const completers = [];
	const foundEasterEggs = new Set();
	const totalEasterEggs = 3;

	function split(line) {
		return line.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map(arg => {
			const quote = arg[0];
			return quote === "\"" || quote === "'" ? arg.slice(1, -1) : arg;
		}) ?? [];
	}

	function register(name, description, run) {
		commands.push({ name, description, run });
	}

	function registerCompleter(complete) {
		completers.push(complete);
	}

	function findEasterEgg(name) {
		if (foundEasterEggs.has(name)) return "you already found this one";

		foundEasterEggs.add(name);
		return `nice try\nYou found ${foundEasterEggs.size} easter eggs out of ${totalEasterEggs}.\n${foundEasterEggs.size === totalEasterEggs ? "Congrats!" : "Consider yourself challenged."}`;
	}

	async function run(line) {
		const trimmed = line.trimStart();
		const easterEgg = trimmed.startsWith("sudo")
			? "sudo"
			: /^rm\s+-\S*r\S*f\S*\s+\/\s*$/.test(trimmed) ? "rm-root" : "";

		if (easterEgg) {
			return findEasterEgg(easterEgg);
		}

		const [name, ...args] = split(line);
		if (!name) return "";

		const command = commands.find(item => item.name === name);
		return command ? await command.run(args) : `zsh: command not found: ${name}`;
	}

	function complete(line, cursor) {
		for (const completer of completers) {
			const completion = completer(line, cursor);
			if (completion) return completion;
		}

		return null;
	}

	register("help", "Show available commands.", () =>
		commands.map(command => `${command.name.padEnd(8)} ${command.description}`).join("\n")
	);

	return { complete, findEasterEgg, register, registerCompleter, run };
})();
