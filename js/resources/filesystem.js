const user = "guest";
const home = "/home/guest";

const dir = children => ({ type: "dir", children });
const file = (content = "") => ({ type: "file", content });

function createFilesystem() {
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

export class FileSystem {
	constructor() {
		this.reset();
	}

	cleanPath(path) {
		const parts = [];
		for (const part of path.split("/")) {
			if (!part || part === ".") continue;
			if (part === "..") parts.pop();
			else parts.push(part);
		}
		return `/${parts.join("/")}`;
	}

	pathOf(path = ".") {
		if (path === "~") return home;
		if (path.startsWith("~/")) return this.cleanPath(`${home}/${path.slice(2)}`);
		if (path === "-") return this.oldcwd;
		return this.cleanPath(path.startsWith("/") ? path : `${this.cwd}/${path}`);
	}

	nodeAt(path) {
		let node = this.root;
		for (const part of this.cleanPath(path).split("/").filter(Boolean)) {
			if (node.type !== "dir" || !node.children[part]) return null;
			node = node.children[part];
		}
		return node;
	}

	parentOf(path) {
		const parts = this.pathOf(path).split("/").filter(Boolean);
		const name = parts.pop();
		return [this.nodeAt(`/${parts.join("/")}`), name];
	}

	displayPath() {
		return this.cwd === home ? "~" : this.cwd.startsWith(`${home}/`) ? `~/${this.cwd.slice(home.length + 1)}` : this.cwd;
	}

	cd(args) {
		if (args.length > 1) return "cd: too many arguments";
		const target = args[0] ?? home;
		const next = this.pathOf(target);
		const node = this.nodeAt(next);
		if (!node) return `cd: no such file or directory: ${target}`;
		if (node.type !== "dir") return `cd: not a directory: ${target}`;
		[this.cwd, this.oldcwd] = [next, this.cwd];
		return target === "-" ? this.cwd : "";
	}

	pwd() {
		return this.cwd;
	}

	ls(args) {
		const flags = args.filter(arg => arg.startsWith("-")).join("");
		const targets = args.filter(arg => !arg.startsWith("-"));
		const paths = targets.length ? targets : ["."];
		const showAll = flags.includes("a");
		const long = flags.includes("l");
		const blocks = [];

		for (const target of paths) {
			const node = this.nodeAt(this.pathOf(target));
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
				const display = child.type === "dir" ? `${name}/` : name;
				return long ? `${child.type === "dir" ? "d" : "-"}rw-r--r--  1 ${user} staff 0 Jul  8 00:00 ${display}` : display;
			});
			blocks.push(paths.length > 1 ? `${target}:\n${list.join(long ? "\n" : "  ")}` : list.join(long ? "\n" : "  "));
		}
		return blocks.join("\n\n");
	}

	mkdir(args) {
		const parents = args[0] === "-p";
		const paths = parents ? args.slice(1) : args;
		if (!paths.length) return "mkdir: missing operand";

		for (const path of paths) {
			let node = this.root;
			const parts = this.pathOf(path).split("/").filter(Boolean);
			if (!parts.length) {
				if (!parents) return `mkdir: ${path}: File exists`;
				continue;
			}
			for (const [index, part] of parts.entries()) {
				const last = index === parts.length - 1;
				if (!node.children[part]) {
					if (!last && !parents) return `mkdir: ${path}: No such file or directory`;
					node.children[part] = dir({});
				} else if (node.children[part].type !== "dir") return `mkdir: ${path}: Not a directory`;
				else if (last && !parents) return `mkdir: ${path}: File exists`;
				node = node.children[part];
			}
		}
		return "";
	}

	removePath(path, recursive, force, directoryOnly) {
		const [parent, name] = this.parentOf(path);
		const node = parent?.children[name];
		const command = directoryOnly ? "rmdir" : "rm";
		if (!name) return directoryOnly ? `rmdir: ${path}: Directory not empty` : `rm: ${path}: is a directory`;
		if (!node) return force ? "" : `${command}: ${path}: No such file or directory`;
		if (node.type === "dir" && !recursive && !directoryOnly) return `rm: ${path}: is a directory`;
		if (node.type !== "dir" && directoryOnly) return `rmdir: ${path}: Not a directory`;
		if (node.type === "dir" && Object.keys(node.children).length && !recursive) return `${command}: ${path}: Directory not empty`;
		delete parent.children[name];
		return "";
	}

	rm(args) {
		const flags = args.filter(arg => arg.startsWith("-")).join("");
		const paths = args.filter(arg => !arg.startsWith("-"));
		const force = flags.includes("f");
		if (!paths.length && !force) return "rm: missing operand";
		return paths.map(path => this.removePath(path, flags.includes("r") || flags.includes("R"), force, false)).filter(Boolean).join("\n");
	}

	rmdir(args) {
		if (!args.length) return "rmdir: missing operand";
		return args.map(path => this.removePath(path, false, false, true)).filter(Boolean).join("\n");
	}

	touch(args) {
		if (!args.length) return "touch: missing file operand";
		for (const path of args) {
			const [parent, name] = this.parentOf(path);
			if (!parent) return `touch: ${path}: No such file or directory`;
			if (parent.type !== "dir") return `touch: ${path}: Not a directory`;
			if (!name || parent.children[name]?.type === "dir") continue;
			parent.children[name] ??= file();
		}
		return "";
	}

	cat(args) {
		if (!args.length) return "cat: missing file operand";
		return args.map(path => {
			const node = this.nodeAt(this.pathOf(path));
			if (!node) return `cat: ${path}: No such file or directory`;
			if (node.type === "dir") return `cat: ${path}: Is a directory`;
			return node.content;
		}).join("\n");
	}

	tree(args) {
		const target = args[0] ?? ".";
		const root = this.nodeAt(this.pathOf(target));
		if (!root) return `tree: ${target}: No such file or directory`;
		const lines = [target];
		const walk = (node, prefix = "") => {
			if (node.type !== "dir") return;
			const entries = Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b));
			entries.forEach(([name, child], index) => {
				const last = index === entries.length - 1;
				lines.push(`${prefix}${last ? "└── " : "├── "}${child.type === "dir" ? `${name}/` : name}`);
				walk(child, `${prefix}${last ? "    " : "│   "}`);
			});
		};
		walk(root);
		return lines.join("\n");
	}

	copyOrMove(args, move) {
		const flags = args.filter(arg => arg.startsWith("-")).join("");
		const paths = args.filter(arg => !arg.startsWith("-"));
		const command = move ? "mv" : "cp";
		if (paths.length < 2) return `${command}: missing file operand`;

		const destination = paths.at(-1);
		const sources = paths.slice(0, -1);
		const destinationPath = this.pathOf(destination);
		const destinationNode = this.nodeAt(destinationPath);
		if (sources.length > 1 && destinationNode?.type !== "dir") return `${command}: target '${destination}' is not a directory`;

		const errors = [];
		for (const source of sources) {
			const sourcePath = this.pathOf(source);
			const sourceNode = this.nodeAt(sourcePath);
			if (!sourceNode) {
				errors.push(`${command}: ${source}: No such file or directory`);
				continue;
			}
			const finalPath = destinationNode?.type === "dir" ? this.cleanPath(`${destinationPath}/${sourcePath.split("/").at(-1)}`) : destinationPath;
			if (move && finalPath === sourcePath) continue;
			if (move && sourceNode.type === "dir" && finalPath.startsWith(`${sourcePath}/`)) {
				errors.push(`mv: cannot move '${source}' to a subdirectory of itself`);
				continue;
			}
			if (!move && sourceNode.type === "dir" && !flags.includes("r") && !flags.includes("R")) {
				errors.push(`cp: ${source} is a directory (not copied).`);
				continue;
			}

			const [parent, name] = this.parentOf(finalPath);
			if (!parent) {
				errors.push(`${command}: ${destination}: No such file or directory`);
				continue;
			}
			parent.children[name] = move ? sourceNode : structuredClone(sourceNode);
			if (move) this.removePath(source, true, false, false);
		}
		return errors.join("\n");
	}

	completePath(line, cursor) {
		const before = line.slice(0, cursor);
		const match = before.match(/(^|\s)(\S*)$/);
		if (!match) return null;
		const token = match[2];
		const slash = token.lastIndexOf("/");
		const parentToken = slash >= 0 ? token.slice(0, slash + 1) : "";
		const partial = slash >= 0 ? token.slice(slash + 1) : token;
		const parent = this.nodeAt(parentToken ? this.pathOf(parentToken) : this.cwd);
		if (!parent || parent.type !== "dir") return null;
		const matches = Object.entries(parent.children).filter(([name]) => name.toLowerCase().startsWith(partial.toLowerCase()));
		if (matches.length !== 1) return null;
		const [name, node] = matches[0];
		const completed = parentToken + (node.type === "dir" ? `${name}/` : name);
		const start = before.length - token.length;
		return { text: before.slice(0, start) + completed + line.slice(cursor), cursor: start + completed.length };
	}

	reset() {
		this.root = createFilesystem();
		this.cwd = home;
		this.oldcwd = home;
		return "filesystem reset";
	}
}
