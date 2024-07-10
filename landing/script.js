// HTML Element References
const terminalOutput = document.getElementById('terminal-output');
const typeInput = document.getElementById('type-input');

// History
let commandHistory = [];
let historyIndex = 0;

/* Enter Detection */
document.addEventListener("keydown", (event) =>
{
	if (event.key === "Enter")
	{
		const command = typeInput.innerHTML.trim().replace(/\s+/g, ' ');
		typeInput.innerHTML = "";

		if (command)
		{
			// History
			commandHistory.push(command);
			historyIndex = commandHistory.length;

			// Output
			terminalOutput.innerHTML += `<div>${"user@frederickschubert.de:~$ " + command}</div>`;
			terminalOutput.scrollTop = terminalOutput.scrollHeight;

			// Command Handling
			let commandparts = command.split(' ');
			let keyword = commandparts[0];
			let args = commandparts.slice(1);
			switch (keyword)
			{
				case "about":
					terminalOutput.innerHTML += "<div><span class='highlight'>Hi there, I'm Freddy!</span><br><br>If you want to get in contact with me – you might have questions, feedback or a quest – you can reach me via this website.<br>In case you’re unsure, contact me anyway. I answer every Email and I am excited for yours!<br><span class='highlight'>Email:</span> <a href='mailto:mail@frederickschubert.de'>mail@frederickschubert.de</a><br><br>Type 'menu' for menu.<br></div>"
					break;
				case "help":
				case "menu":
				case "ls":
					terminalOutput.innerHTML += "<div><span class='highlight'>General:</span> about | menu<br><span class='highlight'>Nagivation:</span> cd [CV | LinkedIn | GitHub] <br><span class='highlight'>Misc:</span> clear | font | color</div>";
					break;
				case "cd":
					if (executeCd(args[0]) != 0)
						terminalOutput.innerHTML += "<div>Usage: cd [CV | LinkedIn | GitHub]</div>";
					break;
				case "clear":
					terminalOutput.innerHTML = "";
					break;
				case "font":
					if (executeFont(args[0]) != 0)
						terminalOutput.innerHTML += "<div>Usage: font [mono|serif|sans|funky]</div>";
					break;
				case "color":
					if (executeColor(args[0]) != 0)
						terminalOutput.innerHTML += "<div>Usage: color [hex color code]</div>";
					break;
				default:
					terminalOutput.innerHTML += `<div>Command not found: '${command}'. Type 'help' for a list of commands.</div>`;
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
	else if (/^[0-9a-zA-Z -#]$/.test(event.key))
	{
		typeInput.innerHTML += event.key;
	}
	else if (event.key == "Backspace")
	{
		event.preventDefault();
		if (typeInput.innerHTML.length > 0)
			typeInput.innerHTML = typeInput.innerHTML.slice(0, -1);
	}
});
