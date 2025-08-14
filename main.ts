import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  MarkdownView,
  Editor,
} from 'obsidian';

interface MyPluginSettings {
  triggerPhrase: string;
}

interface myEditedView extends MarkdownView {
  phraseWidgetEl?: HTMLDivElement

}

const DEFAULT_SETTINGS: MyPluginSettings = {
  triggerPhrase: 'TEST',
};

export default class PhraseWidgetPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    console.log('Loading Flight Tracker plugin');

    await this.loadSettings();
    this.addSettingTab(new SampleSettingTab(this.app, this));

    // Listen for when the user types in a note
    this.registerEvent(
      this.app.workspace.on('editor-change', (e, v) => {this.handleEditorChange(e, v)})
    );
  }

  onunload() {
    console.log('Unloading Phrase-Triggered Widget plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  handleEditorChange(editor: Editor, view: MarkdownView) {

    const cursorPos = editor.getCursor();

    const content = editor.getLine(cursorPos.line);

    console.log(content);

    if (content && content.includes(this.settings.triggerPhrase)) {
      this.showWidget(view);
    } else {
      this.hideWidget(view);
    }
  }

  showWidget(view: myEditedView) {
    console.log("Found phrase");
    // Avoid multiple widgets
    if (view.phraseWidgetEl) return;
    console.log("Adding widget");

    const widgetEl = view.containerEl.createDiv({
      cls: 'phrase-widget',
      text: `Trigger phrase "${this.settings.triggerPhrase}" detected!`,
    });

    // You could style it or add more complex content here
    widgetEl.style.position = 'absolute';
    widgetEl.style.top = '20px';
    widgetEl.style.right = '20px';
    widgetEl.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    widgetEl.style.color = 'white';
    widgetEl.style.padding = '8px 12px';
    widgetEl.style.borderRadius = '4px';
    widgetEl.style.zIndex = '100';

    view.phraseWidgetEl = widgetEl;
  }

  hideWidget(view: myEditedView) {
    console.log('Phrase not found');
    const widgetEl = view.phraseWidgetEl;
    if (widgetEl) {
      widgetEl.remove();
      console.log('Removed Widget');
      delete view.phraseWidgetEl;
    }
  }
}

/**
 * Settings Tab UI
 */
class SampleSettingTab extends PluginSettingTab {
  plugin: PhraseWidgetPlugin;

  constructor(app: App, plugin: PhraseWidgetPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Settings for Phrase-Triggered Widget' });

    new Setting(containerEl)
      .setName('Trigger Phrase')
      .setDesc('Type this phrase in any note to show the widget.')
      .addText(text =>
        text
          .setPlaceholder('Enter phrase')
          .setValue(this.plugin.settings.triggerPhrase)
          .onChange(async (value) => {
            this.plugin.settings.triggerPhrase = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
