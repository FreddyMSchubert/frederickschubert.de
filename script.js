// HTML Element References
const terminalOutput = document.getElementById('terminal-output');
const userCommand = document.getElementById('user-command');

// History
let commandHistory = [];
let historyIndex = 0;

/* Enter Detection */
document.addEventListener("keydown", (event) =>
{
	if (event.key === "Enter")
	{
		const command = userCommand.value.trim();

		if (command)
		{
			// History
			commandHistory.push(command);
			historyIndex = commandHistory.length;

			// Output
			terminalOutput.textContent += `\n${"admin@frederickschubert.de:~$ " + command}`;
			terminalOutput.scrollTop = terminalOutput.scrollHeight;
			userCommand.value = '';

			// Command Handling
			switch (command)
			{
				case "help":
					terminalOutput.textContent += "\nThis text is super helpful! You feel thoroughly helped and a soothing feeling spreads throughout your body. This is a placeholder.";
					break;
				default:
					terminalOutput.textContent += `\nCommand not found: '${command}'. Type 'help' for a list of commands.`;
					break;
			}
		}
	}
	else if (event.key == "ArrowUp" || event.key == "ArrowDown")
	{
		// select correct history element
		if (event.key == "ArrowUp" && historyIndex > 0)
			historyIndex--;
		else if (event.key == "ArrowDown" && historyIndex < commandHistory.length - 1)
			historyIndex++;
		else
			historyIndex = commandHistory.length;

		userCommand.value = commandHistory[historyIndex] || "";
		setTimeout(() => {
			const valueLength = userCommand.value.length;
			userCommand.setSelectionRange(valueLength, valueLength);
		}, 0);
	}
});
