import {
	App,
	Plugin,
	PluginSettingTab,
	MarkdownPostProcessorContext,
	Setting,
	Modal,
} from "obsidian";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import { ReactView } from "./ReactView";

interface FlightPluginSettings {
	triggerPhrase: string;
}

const DEFAULT_SETTINGS: FlightPluginSettings = {
	triggerPhrase: "TEST",
};

export default class FlightTrackerPlugin extends Plugin {
	root: Root | null = null;
	settings: FlightPluginSettings;

	async onload() {
		console.log("Loading Flight Tracker plugin");

		await this.loadSettings();
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerMarkdownPostProcessor(
			(el: HTMLElement, cts: MarkdownPostProcessorContext) => {
				const marker = "TEST";
				const paragraphs = el.querySelectorAll("p");

				paragraphs.forEach((p) => {
					if (p.innerText.contains(marker)) {
						// Cut existing line of HTML into sections
						const parts = p.innerHTML.split(marker);
						p.innerHTML = "";

						p.insertAdjacentHTML("beforeend", parts[0]);

						//Add widget where keyword was
						const widget = document.createElement("span");
						widget.classList.add("inline-widget");
						widget.textContent = "Ass";
						widget.style.cursor = "pointer";

						// Add event listener to open the modal
						widget.onclick = () => {
							new FlightModal(this.app).open();
						};

						p.appendChild(widget);

						if (parts[1]) {
							p.insertAdjacentHTML("beforeend", parts[1]);
						}
					}
				});
			},
		);
	}

	onunload() {
		console.log("Unloading Flight Tracker plugin");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

export class FlightModal extends Modal {
	constructor(app: App) {
		super(app);
		this.setContent("This is a test!");
	}
}

/**
 * Settings Tab UI
 */
class SampleSettingTab extends PluginSettingTab {
	plugin: FlightTrackerPlugin;

	constructor(app: App, plugin: FlightTrackerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h2", {
			text: "Settings for Phrase-Triggered Widget",
		});

		new Setting(containerEl)
			.setName("Trigger Phrase")
			.setDesc("Type this phrase in any note to show the widget.")
			.addText((text) =>
				text
					.setPlaceholder("Enter phrase")
					.setValue(this.plugin.settings.triggerPhrase)
					.onChange(async (value) => {
						this.plugin.settings.triggerPhrase = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
