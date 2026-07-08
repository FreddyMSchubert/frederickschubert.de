const input = document.getElementById("input");

const inputState = {
	text: "",
	cursor: 0,
};

function renderCustomInput() {
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
	if (event.ctrlKey || event.metaKey || event.altKey) return;

	switch (event.key) {
		case "Backspace":
			if (inputState.cursor > 0) {
				inputState.text =
				inputState.text.slice(0, inputState.cursor - 1) +
				inputState.text.slice(inputState.cursor);

				inputState.cursor--;
			}
			break;

		case "Delete":
			inputState.text =
				inputState.text.slice(0, inputState.cursor) +
				inputState.text.slice(inputState.cursor + 1);
			break;

		case "ArrowLeft":
			inputState.cursor = Math.max(0, inputState.cursor - 1);
			break;

		case "ArrowRight":
			inputState.cursor = Math.min(inputState.text.length, inputState.cursor + 1);
			break;

		case "Home":
			inputState.cursor = 0;
			break;

		case "End":
			inputState.cursor = inputState.text.length;
			break;

		default:
			if (event.key.length === 1) {
				inputState.text =
				inputState.text.slice(0, inputState.cursor) +
				event.key +
				inputState.text.slice(inputState.cursor);

				inputState.cursor++;
			}
	}

	event.preventDefault();
	renderCustomInput();
});

renderCustomInput();
