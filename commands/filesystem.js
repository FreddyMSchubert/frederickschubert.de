const TerminalFilesystem = (() => {
	const user = "guest";
	const home = "/home/guest";
	let cwd = home;
	let oldcwd = home;
	let fs = createFs();

	function createFs() {
		const dir = children => ({ type: "dir", children });
		const file = content => ({ type: "file", content: content ?? "" });

		return dir({
			bin: dir({}),
			dev: dir({}),
			etc: dir({ hosts: file("127.0.0.1 localhost\n::1 localhost"), zshrc: file("# fake zsh config") }),
			home: dir({ guest: dir({ Desktop: dir({}), Documents: dir({}), Downloads: dir({}) }) }),
			lib: dir({}),
			opt: dir({}),
			private: dir({ tmp: dir({}) }),
			sbin: dir({}),
			tmp: dir({}),
			usr: dir({
				bin: dir({}),
				local: dir({ bin: dir({}) }),
				share: dir({
					"about.txt": file("Freddy CLI\nA small fake zsh-style filesystem running in your browser.\nUser: guest\nHome: /home/guest"),
				}),
			}),
			var: dir({ log: dir({}) }),
		});
	}

	function cleanPath(path) {
		const parts = [];

		for (const part of path.split("/")) {
			if (!part || part === ".") continue;
			if (part === "..") parts.pop();
			else parts.push(part);
		}

		return `/${parts.join("/")}`;
	}

	function pathOf(path = ".") {
		if (path === "~") return home;
		if (path.startsWith("~/")) return cleanPath(`${home}/${path.slice(2)}`);
		if (path === "-") return oldcwd;
		return cleanPath(path.startsWith("/") ? path : `${cwd}/${path}`);
	}

	function nodeAt(path) {
		let node = fs;

		for (const part of cleanPath(path).split("/").filter(Boolean)) {
			if (node.type !== "dir" || !node.children[part]) return null;
			node = node.children[part];
		}

		return node;
	}

	function parentOf(path) {
		const full = pathOf(path);
		const parts = full.split("/").filter(Boolean);
		const name = parts.pop();
		const parent = nodeAt(`/${parts.join("/")}`);
		return [parent, name];
	}

	function clone(node) {
		return node.type === "file"
			? { type: "file" }
			: { type: "dir", children: Object.fromEntries(Object.entries(node.children).map(([name, child]) => [name, clone(child)])) };
	}

	function nameOf(path) {
		return cleanPath(path).split("/").filter(Boolean).at(-1);
	}

	function displayName(name, node) {
		return node.type === "dir" ? `${name}/` : name;
	}

	function displayPath() {
		return cwd === home ? "~" : cwd.startsWith(`${home}/`) ? `~/${cwd.slice(home.length + 1)}` : cwd;
	}

	function cd(args) {
		if (args.length > 1) return "cd: too many arguments";

		const target = args[0] ?? home;
		const next = pathOf(target);
		const node = nodeAt(next);

		if (!node) return `cd: no such file or directory: ${target}`;
		if (node.type !== "dir") return `cd: not a directory: ${target}`;

		[cwd, oldcwd] = [next, cwd];
		return target === "-" ? cwd : "";
	}

	function pwd() {
		return cwd;
	}

	function ls(args) {
		const flags = args.filter(arg => arg.startsWith("-")).join("");
		const paths = args.filter(arg => !arg.startsWith("-"));
		const showAll = flags.includes("a");
		const long = flags.includes("l");
		const targets = paths.length ? paths : ["."];
		const blocks = [];

		for (const target of targets) {
			const node = nodeAt(pathOf(target));

			if (!node) {
				blocks.push(`ls: ${target}: No such file or directory`);
				continue;
			}

			if (node.type === "file") {
				blocks.push(long ? `-rw-r--r--  1 ${user} staff 0 Jul  8 00:00 ${target}` : target);
				continue;
			}

			const names = Object.keys(node.children).sort();
			const list = (showAll ? [".", "..", ...names] : names).map(name => {
				const child = name === "." || name === ".." ? { type: "dir" } : node.children[name];
				return long
					? `${child.type === "dir" ? "d" : "-"}rw-r--r--  1 ${user} staff 0 Jul  8 00:00 ${displayName(name, child)}`
					: displayName(name, child);
			});

			blocks.push(targets.length > 1 ? `${target}:\n${list.join(long ? "\n" : "  ")}` : list.join(long ? "\n" : "  "));
		}

		return blocks.join("\n\n");
	}

	function mkdir(args) {
		const parents = args[0] === "-p";
		const paths = parents ? args.slice(1) : args;
		if (!paths.length) return "mkdir: missing operand";

		for (const path of paths) {
			let node = fs;
			const parts = pathOf(path).split("/").filter(Boolean);
			if (!parts.length) {
				if (!parents) return `mkdir: ${path}: File exists`;
				continue;
			}

			for (const [index, part] of parts.entries()) {
				const last = index === parts.length - 1;
				if (!node.children[part]) {
					if (!last && !parents) return `mkdir: ${path}: No such file or directory`;
					node.children[part] = { type: "dir", children: {} };
				} else if (node.children[part].type !== "dir") {
					return `mkdir: ${path}: Not a directory`;
				} else if (last && !parents) {
					return `mkdir: ${path}: File exists`;
				}
				node = node.children[part];
			}
		}

		return "";
	}

	function removePath(path, recursive, force, dirOnly) {
		const [parent, name] = parentOf(path);
		const node = parent?.children[name];

		if (!name) return dirOnly ? `rmdir: ${path}: Directory not empty` : `rm: ${path}: is a directory`;
		if (!node) return force ? "" : `${dirOnly ? "rmdir" : "rm"}: ${path}: No such file or directory`;
		if (node.type === "dir" && !recursive && !dirOnly) return `rm: ${path}: is a directory`;
		if (node.type !== "dir" && dirOnly) return `rmdir: ${path}: Not a directory`;
		if (node.type === "dir" && Object.keys(node.children).length && !recursive) return `${dirOnly ? "rmdir" : "rm"}: ${path}: Directory not empty`;

		delete parent.children[name];
		return "";
	}

	function rm(args) {
		const flags = args.filter(arg => arg.startsWith("-")).join("");
		const paths = args.filter(arg => !arg.startsWith("-"));
		const force = flags.includes("f");
		const recursive = flags.includes("r") || flags.includes("R");

		if (!paths.length && !force) return "rm: missing operand";
		return paths.map(path => removePath(path, recursive, force, false)).filter(Boolean).join("\n");
	}

	function rmdir(args) {
		if (!args.length) return "rmdir: missing operand";
		return args.map(path => removePath(path, false, false, true)).filter(Boolean).join("\n");
	}

	function touch(args) {
		if (!args.length) return "touch: missing file operand";

		for (const path of args) {
			const [parent, name] = parentOf(path);
			if (!parent) return `touch: ${path}: No such file or directory`;
			if (parent.type !== "dir") return `touch: ${path}: Not a directory`;
			if (!name || parent.children[name]?.type === "dir") continue;
			parent.children[name] ??= { type: "file" };
		}

		return "";
	}

	function cat(args) {
		if (!args.length) return "cat: missing file operand";

		return args.map(path => {
			const node = nodeAt(pathOf(path));
			if (!node) return `cat: ${path}: No such file or directory`;
			if (node.type === "dir") return `cat: ${path}: Is a directory`;
			return node.content;
		}).join("\n");
	}

	function about() {
		return cat(["/usr/share/about.txt"]);
	}

	function tree(args) {
		const target = args[0] ?? ".";
		const root = nodeAt(pathOf(target));
		if (!root) return `tree: ${target}: No such file or directory`;

		const gap = "\u00a0\u00a0\u00a0";
		const lines = [target];
		function walk(node, prefix = "") {
			if (node.type !== "dir") return;

			const entries = Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b));
			entries.forEach(([name, child], index) => {
				const last = index === entries.length - 1;
				lines.push(`${prefix}${last ? "└── " : "├── "}${displayName(name, child)}`);
				walk(child, `${prefix}${last ? `\u00a0${gap}` : `│${gap}`}`);
			});
		}

		walk(root);
		return lines.join("\n");
	}

	function putPath(sourcePath, destPath, sourceNode, move, recursive) {
		const destNode = nodeAt(destPath);
		const destIsDir = destNode?.type === "dir";
		const finalPath = destIsDir ? `${destPath}/${nameOf(sourcePath)}` : destPath;
		const [destParent, destName] = parentOf(finalPath);

		if (!destParent) return `${move ? "mv" : "cp"}: ${destPath}: No such file or directory`;
		if (destParent.type !== "dir") return `${move ? "mv" : "cp"}: ${destPath}: Not a directory`;
		if (!destName) return `${move ? "mv" : "cp"}: /: Is a directory`;
		if (!move && sourceNode.type === "dir" && !recursive) return `cp: ${sourcePath} is a directory (not copied).`;

		destParent.children[destName] = move ? sourceNode : clone(sourceNode);
		return "";
	}

	function copyOrMove(args, move) {
		const flags = args.filter(arg => arg.startsWith("-")).join("");
		const paths = args.filter(arg => !arg.startsWith("-"));
		const command = move ? "mv" : "cp";
		const recursive = flags.includes("R") || flags.includes("r");
		const dest = paths.at(-1);
		const sources = paths.slice(0, -1);
		const destNode = dest ? nodeAt(pathOf(dest)) : null;

		if (paths.length < 2) return `${command}: missing file operand`;
		if (sources.length > 1 && destNode?.type !== "dir") return `${command}: target '${dest}' is not a directory`;

		const errors = [];
		for (const source of sources) {
			const sourcePath = pathOf(source);
			const sourceNode = nodeAt(sourcePath);
			const destPath = pathOf(dest);
			const finalPath = destNode?.type === "dir" ? cleanPath(`${destPath}/${nameOf(sourcePath)}`) : destPath;
			if (!sourceNode) {
				errors.push(`${command}: ${source}: No such file or directory`);
				continue;
			}
			if (move && finalPath === sourcePath) continue;
			if (move && sourceNode.type === "dir" && finalPath.startsWith(`${sourcePath}/`)) {
				errors.push(`mv: cannot move '${source}' to a subdirectory of itself`);
				continue;
			}

			const error = putPath(sourcePath, destPath, sourceNode, move, recursive);
			if (error) errors.push(error);
			else if (move) removePath(source, true, false, false);
		}

		return errors.join("\n");
	}

	function completePath(line, cursor) {
		const before = line.slice(0, cursor);
		const match = before.match(/(^|\s)(\S*)$/);
		if (!match) return null;

		const token = match[2];
		const slash = token.lastIndexOf("/");
		const parentToken = slash >= 0 ? token.slice(0, slash + 1) : "";
		const partial = slash >= 0 ? token.slice(slash + 1) : token;
		const parent = nodeAt(parentToken ? pathOf(parentToken) : cwd);
		if (!parent || parent.type !== "dir") return null;

		const matches = Object.entries(parent.children)
			.filter(([name]) => name.toLowerCase().startsWith(partial.toLowerCase()));
		if (matches.length !== 1) return null;

		const completed = parentToken + displayName(matches[0][0], matches[0][1]);
		const start = before.length - token.length;
		return {
			text: before.slice(0, start) + completed + line.slice(cursor),
			cursor: start + completed.length,
		};
	}

	function reset() {
		fs = createFs();
		cwd = home;
		oldcwd = home;
		return "filesystem reset";
	}

	[
		["cd", "Change directory.", cd],
		["pwd", "Print working directory.", pwd],
		["ls", "List directory contents.", ls],
		["mkdir", "Create directories.", mkdir],
		["mv", "Move or rename files and directories.", args => copyOrMove(args, true)],
		["cp", "Copy files. Use -R for directories.", args => copyOrMove(args, false)],
		["rm", "Remove files or directories.", rm],
		["rmdir", "Remove empty directories.", rmdir],
		["touch", "Create files or update their timestamp.", touch],
		["cat", "Print file contents.", cat],
		["tree", "Print files as a tree.", tree],
		["about", "Print information about this terminal.", about],
		["reset", "Reset the fake filesystem.", reset],
	].forEach(command => TerminalCommands.register(...command));
	TerminalCommands.registerCompleter(completePath);

	return { completePath, displayPath };
})();
