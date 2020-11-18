import { View } from 'framework/views/view';
import { Shortcuts } from 'comp/app/shortcuts';
import { SimulateKeys } from 'comp/app/simulate-keys';
import { Launcher } from 'comp/launcher';
import { Keys } from 'const/keys';
import { Features } from 'util/features';
import { Locale } from 'util/locale';
import template from 'templates/settings/settings-shortcuts.hbs';

class SettingsShortcutsView extends View {
    template = template;

    systemShortcuts = [
        'Meta+A',
        'Alt+A',
        'Alt+C',
        'Alt+D',
        'Meta+F',
        'Meta+C',
        'Meta+B',
        'Meta+U',
        'Meta+T',
        'Alt+N',
        'Meta+O',
        'Meta+S',
        'Meta+G',
        'Meta+,',
        'Meta+L'
    ];

    events = {
        'click button.shortcut': 'shortcutClick',
        'click button.simulate': 'simulateClick'
    };

    render() {
        super.render({
            cmd: Shortcuts.actionShortcutSymbol(true),
            alt: Shortcuts.altShortcutSymbol(true),
            globalIsLarge: !Features.isMac,
            autoTypeSupported: !!Launcher,
            copyPaste: SimulateKeys.simulateKeyText('copyPaste', true),
            globalShortcuts:
                Launcher && !window.utools
                    ? {
                          autoType: Shortcuts.globalShortcutText('autoType', true),
                          copyPassword: Shortcuts.globalShortcutText('copyPassword', true),
                          copyUser: Shortcuts.globalShortcutText('copyUser', true),
                          copyUrl: Shortcuts.globalShortcutText('copyUrl', true),
                          copyOtp: Shortcuts.globalShortcutText('copyOtp', true),
                          restoreApp: Shortcuts.globalShortcutText('restoreApp', true)
                      }
                    : undefined
        });
    }

    shortcutClick(e) {
        const globalShortcutType = e.target.dataset.shortcut;

        const existing = $(`.shortcut__editor[data-shortcut=${globalShortcutType}]`);
        if (existing.length) {
            existing.remove();
            return;
        }

        const shortcutEditor = $('<div/>')
            .addClass('shortcut__editor')
            .attr('data-shortcut', globalShortcutType);
        $('<div/>').text(Locale.setShEdit).appendTo(shortcutEditor);
        const shortcutEditorInput = $('<input/>')
            .addClass('shortcut__editor-input')
            .val(Shortcuts.globalShortcutText(globalShortcutType))
            .appendTo(shortcutEditor);
        if (!Features.isMac) {
            shortcutEditorInput.addClass('shortcut__editor-input--large');
        }

        shortcutEditor.insertAfter($(e.target).parent());
        shortcutEditorInput.focus();
        shortcutEditorInput.on('keypress', (e) => e.preventDefault());
        shortcutEditorInput.on('keydown', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();

            if (e.which === Keys.DOM_VK_DELETE || e.which === Keys.DOM_VK_BACK_SPACE) {
                Shortcuts.setGlobalShortcut(globalShortcutType, undefined);
                this.render();
                return;
            }
            if (e.which === Keys.DOM_VK_ESCAPE) {
                shortcutEditorInput.blur();
                return;
            }

            const shortcut = Shortcuts.keyEventToShortcut(e);
            const presentableShortcutText = Shortcuts.presentShortcut(shortcut.value);

            shortcutEditorInput.val(presentableShortcutText);

            const exists = this.systemShortcuts.includes(shortcut.text);
            shortcutEditorInput.toggleClass('input--error', exists);

            const isValid = shortcut.valid && !exists;
            if (isValid) {
                Shortcuts.setGlobalShortcut(globalShortcutType, shortcut.value);
                this.render();
            }
        });
    }

    simulateClick(e) {
        const simulateType = e.target.dataset.simulate;

        const existing = $(`.simulate__editor[data-simulate=${simulateType}]`);
        if (existing.length) {
            existing.remove();
            return;
        }

        const simulateEditor = $('<div/>')
            .addClass('simulate__editor')
            .attr('data-simulate', simulateType);
        $('<div/>').text(Locale.setShEdit).appendTo(simulateEditor);
        const simulateEditorInput = $('<input/>')
            .addClass('simulate__editor-input')
            .val(SimulateKeys.simulateKeyText(simulateType))
            .appendTo(simulateEditor);
        if (!Features.isMac) {
            simulateEditorInput.addClass('simulate__editor-input--large');
        }

        simulateEditor.insertAfter($(e.target).parent());
        simulateEditorInput.focus();
        simulateEditorInput.on('keypress', (e) => e.preventDefault());
        simulateEditorInput.on('keydown', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();

            if (e.which === Keys.DOM_VK_DELETE || e.which === Keys.DOM_VK_BACK_SPACE) {
                SimulateKeys.setSimulateKey(simulateType, undefined);
                this.render();
                return;
            }
            if (e.which === Keys.DOM_VK_ESCAPE) {
                simulateEditorInput.blur();
                return;
            }

            const simulateKey = SimulateKeys.keyEventToSimulateKey(e);

            simulateEditorInput.val(SimulateKeys.presentSimulateKey(simulateKey.value));

            if (simulateKey.valid) {
                SimulateKeys.setSimulateKey(simulateType, simulateKey.value);
                this.render();
            }
        });
    }
}

export { SettingsShortcutsView };
