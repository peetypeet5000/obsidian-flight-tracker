import { App, Modal } from "obsidian";

// Modal logic for both views
export class FlightModal extends Modal {
	flightCode: string;
	data: any;

	constructor(app: App, flightCode: string, data: any) {
		super(app);
		this.flightCode = flightCode;
		this.data = data;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: `Flight: ${this.flightCode}` });

		if (this.data) {
			contentEl.createEl("p", { text: `Status: ${this.data.status}` });
			contentEl.createEl("p", {
				text: `${this.data.departure} → ${this.data.arrival}`,
			});
		} else {
			contentEl.createEl("p", { text: "Fetching flight data..." });
		}
	}
}
