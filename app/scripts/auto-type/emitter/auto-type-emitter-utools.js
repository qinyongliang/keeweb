import { Launcher } from 'comp/launcher';

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

const AutoTypeEmitter = function (callback) {
    this.callback = callback;
    this.mod = {};
    this.pendingScript = [];
};

AutoTypeEmitter.prototype.setMod = function (mod, enabled) {};

AutoTypeEmitter.prototype.text = function (text) {
    if (text) {
        if (text.length > 1) {
            this.copyPaste(text);
        } else {
            this.key(text);
        }
    } else {
        this.callback();
    }
};

AutoTypeEmitter.prototype.key = function sync(key) {
    if (shiftKeyMap[key]) {
        window.utools.simulateKeyboardTap(shiftKeyMap[key], 'shift');
        sleep(10);
    } else {
        window.utools.simulateKeyboardTap(key);
    }
    this.callback();
};

AutoTypeEmitter.prototype.copyPaste = function (text) {
    Launcher.setClipboardText(text);
    sleep(200);
    window.utools.simulateKeyboardTap('v', window.utools.isMacOs() ? 'command' : 'ctrl');
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
