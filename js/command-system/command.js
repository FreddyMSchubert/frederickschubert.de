export class Command {
	static command() {
		throw new TypeError(`${this.name} must implement static command()`);
	}

	static description() {
		throw new TypeError(`${this.name} must implement static description()`);
	}

	constructor(context) {
		Object.assign(this, context);
	}

	async run(_args) {}

	handleInput(_event) {}
}
