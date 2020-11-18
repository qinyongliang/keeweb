import { Keys } from 'const/keys';
import { AppSettingsModel } from 'models/app-settings-model';
import { Features } from 'util/features';
import { StringFormat } from 'util/formatting/string-format';
import { Locale } from 'util/locale';

let allowedKeys;

function getAllowedKeys() {
    if (!allowedKeys) {
        allowedKeys = {};
        for (const [name, code] of Object.entries(Keys)) {
            const keyName = name.replace('DOM_VK_', '');
            if (/^([0-9A-Z]|F\d{1,2})$/.test(keyName)) {
                allowedKeys[code] = keyName;
            }
        }
    }
    return allowedKeys;
}
const simulateKeys = {
    copyPaste: { mac: 'Command+V', all: 'Ctrl+V' }
};

const SimulateKeys = {
    keyEventToSimulateKey(event) {
        const modifiers = [];
        if (event.ctrlKey) {
            modifiers.push('Ctrl');
        }
        if (event.altKey) {
            modifiers.push('Alt');
        }
        if (event.shiftKey) {
            modifiers.push('Shift');
        }
        if (Features.isMac && event.metaKey) {
            modifiers.push('Command');
        }
        const keyName = getAllowedKeys()[event.which];
        return {
            value: modifiers.join('+') + '+' + (keyName || '…'),
            valid: modifiers.length > 0 && !!keyName
        };
    },
    presentSimulateKey(simulateKeyValue, formatting) {
        if (!simulateKeyValue) {
            return '-';
        }
        return simulateKeyValue
            .split(/\+/g)
            .map((part) => {
                switch (part) {
                    case 'Ctrl':
                        return this.ctrlSimulateKeySymbol(formatting);
                    case 'Alt':
                        return this.altSimulateKeySymbol(formatting);
                    case 'Shift':
                        return this.shiftSimulateKeySymbol(formatting);
                    case 'Command':
                        return this.actionSimulateKeySymbol(formatting);
                    default:
                        return part;
                }
            })
            .join('');
    },
    actionSimulateKeySymbol(formatting) {
        return Features.isMac ? '⌘' : this.formatSimulateKey(Locale.ctrlKey, formatting);
    },
    altSimulateKeySymbol(formatting) {
        return Features.isMac ? '⌥' : this.formatSimulateKey(Locale.altKey, formatting);
    },
    shiftSimulateKeySymbol(formatting) {
        return Features.isMac ? '⇧' : this.formatSimulateKey(Locale.shiftKey, formatting);
    },
    ctrlSimulateKeySymbol(formatting) {
        return Features.isMac ? '⌃' : this.formatSimulateKey(Locale.ctrlKey, formatting);
    },
    formatSimulateKey(SimulateKey, formatting) {
        return formatting ? `${SimulateKey} + ` : `${SimulateKey}+`;
    },
    simulateKeyText(type, formatting) {
        return this.presentSimulateKey(this.simulateKey(type), formatting);
    },
    simulateKey(type) {
        const appSettingsSimulateKey = AppSettingsModel[this.SimulateKeyAppSettingsKey(type)];
        if (appSettingsSimulateKey) {
            return appSettingsSimulateKey;
        }
        const simulateKey = simulateKeys[type];
        if (simulateKey) {
            if (Features.isMac && simulateKey.mac) {
                return simulateKey.mac;
            }
            return simulateKey.all;
        }
        return undefined;
    },
    setSimulateKey(type, value) {
        if (!simulateKeys[type]) {
            throw new Error('Bad SimulateKey: ' + type);
        }
        if (value) {
            AppSettingsModel[this.SimulateKeyAppSettingsKey(type)] = value;
        } else {
            delete AppSettingsModel[this.SimulateKeyAppSettingsKey(type)];
        }
    },
    SimulateKeyAppSettingsKey(type) {
        return 'SimulateKey' + StringFormat.capFirst(type);
    }
};

export { SimulateKeys };
