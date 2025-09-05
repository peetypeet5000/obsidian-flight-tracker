import {
	App,
	Plugin,
	PluginSettingTab,
	MarkdownPostProcessorContext,
	Setting,
} from "obsidian";
import {
	Decoration,
	DecorationSet,
	EditorView,
	MatchDecorator,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { FlightModal } from "flightModal";

interface FlightPluginSettings {
	triggerPhrase: string;
}

const DEFAULT_SETTINGS: FlightPluginSettings = {
	triggerPhrase: "TEST",
};

const FLIGHT_REGEX = /\b[A-Z]{2,3}\d{1,4}\b/g;

export default class FlightTrackerPlugin extends Plugin {
	settings: FlightPluginSettings;
	flightCodes: Set<string> = new Set();
	flightData: Map<string, any> = new Map();

	async onload() {
		console.log("Loading Flight Tracker plugin");

		await this.loadSettings();
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// Register markdown post processor for reading view
		this.registerMarkdownPostProcessor(
			(el: HTMLElement, cts: MarkdownPostProcessorContext) => {
				this.processRendered(el);
			},
		);

		// Register Editor Extension for Live View and Markdown mode
		this.registerEditorExtension(this.createEditorExtension());
	}

	// Whenever a new flight code is found, store it in memory
	addFlightCode(code: string) {
		if (!this.flightCodes.has(code)) {
			this.flightCodes.add(code);
			console.log("New flight code found:", code);
			this.updateFlightData(); // optional immediate fetch
		}
	}

	// Update flight data in background
	async updateFlightData() {
		for (const code of this.flightCodes) {
			if (!this.flightData.has(code)) {
				// 🔧 Replace with your real API call
				const data = await this.fakeApiCall(code);
				this.flightData.set(code, data);
			}
		}
	}

	async fakeApiCall(code: string) {
		// Replace this with real API later
		return {
			status: "On time",
			departure: "SFO",
			arrival: "LAX",
			code,
		};
	}

	// Render the widget in both markdown and reading mode
	renderWidget(flightCode: string): HTMLElement {
		// Add flight code if not already present
		this.addFlightCode(flightCode);

		const widget = document.createElement("span");
		widget.classList.add("inline-widget");
		widget.textContent = flightCode;
		widget.style.cursor = "pointer";

		// Set click handler to create modal, populate modal with fetched flight data
		widget.onclick = () =>
			new FlightModal(
				this.app,
				flightCode,
				this.flightData.get(flightCode),
			).open();

		return widget;
	}

	// Process token and replace HTML in reading view
	processRendered(el: HTMLElement) {
		el.querySelectorAll("p").forEach((p) => {
			if (FLIGHT_REGEX.test(p.innerText)) {
				p.innerHTML = p.innerHTML.replace(
					FLIGHT_REGEX,
					(code) => this.renderWidget(code).outerHTML,
				);
			}
		});
	}

	// Process token and replace in editor view
	createEditorExtension() {
		const deco = new MatchDecorator({
			regexp: FLIGHT_REGEX,
			decoration: (match) =>
				Decoration.replace({
					widget: new InlineWidgetView(this.app, this, match[0]),
				}),
		});

		return ViewPlugin.fromClass(
			class {
				decorations: DecorationSet;

				constructor(view: EditorView) {
					this.decorations = deco.createDeco(view);
				}

				update(update: ViewUpdate) {
					this.decorations = deco.updateDeco(
						update,
						this.decorations,
					);
				}
			},
			{
				decorations: (v) => v.decorations,
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

// Widget view for Live Preview and Source Mode
class InlineWidgetView extends WidgetType {
	app: App;
	plugin: FlightTrackerPlugin;
	flightCode: string;

	constructor(app: App, plugin: FlightTrackerPlugin, flightCode: string) {
		super();
		this.app = app;
		this.plugin = plugin;
		this.flightCode = flightCode;
	}

	toDOM() {
		return this.plugin.renderWidget(this.flightCode);
	}

	ignoreEvent() {
		return false; // let clicks work
	}

	// Optional but recommended: avoid remounting if nothing changed
	//eq(other: InlineWidgetView) {
	//	return this.app === other.app;
	//}

	// Optional: ensures DOM updates don’t replace widget unnecessarily
	//updateDOM(dom: HTMLElement) {
	//	return false; // false → always recreate
	//}
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
