export class Command {
	static names() {
		throw new TypeError(`${this.name} must implement static names()`);
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
