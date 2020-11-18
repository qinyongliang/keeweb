import { Launcher } from 'comp/launcher';
import { SimulateKeys } from 'comp/app/simulate-keys';

// https://msdn.microsoft.com/en-us/library/windows/desktop/dd375731(v=vs.85).aspx
const shiftKeyMap = {
    'A': 'a',
    'B': 'b',
    'C': 'c',
    'D': 'd',
    'E': 'e',
    'F': 'f',
    'G': 'g',
    'H': 'h',
    'I': 'i',
    'J': 'j',
    'K': 'k',
    'L': 'l',
    'M': 'm',
    'N': 'n',
    'O': 'o',
    'P': 'p',
    'Q': 'q',
    'R': 'r',
    'S': 's',
    'T': 't',
    'U': 'u',
    'V': 'v',
    'W': 'w',
    'X': 'x',
    'Y': 'y',
    'Z': 'z',
    '!': '1',
    '@': '2',
    '#': '3',
    '$': '4',
    '%': '5',
    '^': '6',
    '&': '7',
    '*': '8',
    '(': '9',
    ')': '0',
    '_': '-',
    '+': '=',
    '~': '`',
    '<': ',',
    '>': '.',
    '?': '/',
    '|': '\\',
    ':': ';',
    '"': "'",
    '{': '[',
    '}': ']'
};

const KeyMap = {
    pgup: 'pageup',
    pgdn: 'pagedown',
    ins: 'insert',
    del: 'delete',
    bs: 'backspace'
};

const ModMap = {
    '^': 'command',
    '+': 'shift',
    '%': 'alt',
    '^^': 'ctrl'
};

const AutoTypeEmitter = function (callback) {
    this.callback = callback;
    this.mod = {};
    this.pendingScript = [];
};

AutoTypeEmitter.prototype.setMod = function (mod, enabled) {
    if (enabled) {
        this.mod[ModMap[mod]] = true;
    } else {
        delete this.mod[ModMap[mod]];
    }
};

AutoTypeEmitter.prototype.text = function (text) {
    if (text) {
        const hot = Object.keys(this.mod);
        if (hot && hot.length > 0) {
            const keys = [...text.split(''), ...hot].map(this.doKeyMap).map((v) => `'${v}'`);
            // eslint-disable-next-line no-eval
            eval(`window.utools.simulateKeyboardTap(${keys.join(',')})`);
            this.callback();
        } else {
            if (text.length > 1) {
                this.copyPaste(text);
            } else {
                this.key(text);
            }
        }
    } else {
        this.callback();
    }
};

AutoTypeEmitter.prototype.doKeyMap = function (key) {
    if (KeyMap[key]) {
        return KeyMap[key];
    }
    return key;
};

AutoTypeEmitter.prototype.key = function sync(key) {
    key = this.doKeyMap(key);
    if (shiftKeyMap[key]) {
        window.utools.simulateKeyboardTap(shiftKeyMap[key], 'shift');
    } else {
        window.utools.simulateKeyboardTap(key);
    }
    sleep(10);
    this.callback();
};

AutoTypeEmitter.prototype.copyPaste = function (text) {
    Launcher.setClipboardText(text);
    sleep(200);
    const keys = SimulateKeys.simulateKey('copyPaste').split('+');
    window.utools.simulateKeyboardTap(keys[1], keys[0]);
    sleep(200);
    this.callback();
};

AutoTypeEmitter.prototype.wait = function (time) {
    setTimeout(() => this.callback(), time);
};

AutoTypeEmitter.prototype.setDelay = function (delay) {
    this.delay = delay || 0;
    this.callback('Not implemented');
};

AutoTypeEmitter.prototype.modStr = function () {
    return Object.keys(this.mod).join('');
};

AutoTypeEmitter.prototype.waitComplete = function (callback) {
    this.callback();
};

function sleep(sec) {
    const startTime = new Date().getTime();
    const stopTime = startTime + Math.floor(sec);
    for (;;) {
        const curTime = new Date().getTime();
        if (stopTime <= curTime) break;
    }
}

export { AutoTypeEmitter };
