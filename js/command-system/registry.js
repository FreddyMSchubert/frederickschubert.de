import { Hangman } from "../commands/games/hangman.js";
import { About } from "../commands/system/about.js";
import { Calc } from "../commands/system/calc.js";
import { Clear } from "../commands/system/clear.js";
import { Echo } from "../commands/system/echo.js";
import { Exit } from "../commands/system/exit.js";
import { Help } from "../commands/system/help.js";
import { Joke } from "../commands/system/joke.js";
import { Sudo } from "../commands/system/sudo.js";
import { Cat } from "../commands/filesystem/cat.js";
import { Cd } from "../commands/filesystem/cd.js";
import { Cp } from "../commands/filesystem/cp.js";
import { Ls } from "../commands/filesystem/ls.js";
import { Mkdir } from "../commands/filesystem/mkdir.js";
import { Mv } from "../commands/filesystem/mv.js";
import { Pwd } from "../commands/filesystem/pwd.js";
import { Reset } from "../commands/filesystem/reset.js";
import { Rm } from "../commands/filesystem/rm.js";
import { Rmdir } from "../commands/filesystem/rmdir.js";
import { Touch } from "../commands/filesystem/touch.js";
import { Tree } from "../commands/filesystem/tree.js";

export const commands = [
	Help, About, Calc, Clear, Echo, Exit, Joke, Sudo,
	Cd, Pwd, Ls, Mkdir, Mv, Cp, Rm, Rmdir, Touch, Cat, Tree, Reset,
	Hangman,
];

const names = new Set();
for (const command of commands) {
	const identifiers = command.names();
	const description = command.description();
	if (!Array.isArray(identifiers) || !identifiers.length || typeof description !== "string" || !description) {
		throw new TypeError(`${command.name} has invalid metadata`);
	}
	for (const identifier of identifiers) {
		if (typeof identifier !== "string" || !identifier) throw new TypeError(`${command.name} has an invalid name`);
		if (names.has(identifier)) throw new TypeError(`Duplicate command name: ${identifier}`);
		names.add(identifier);
	}
}
