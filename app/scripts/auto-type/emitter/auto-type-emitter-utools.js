import { Launcher } from 'comp/launcher';

// https://msdn.microsoft.com/en-us/library/windows/desktop/dd375731(v=vs.85).aspx

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
    window.utools.simulateKeyboardTap(key);
    this.callback();
};
AutoTypeEmitter.prototype.copyPaste = function (text) {
    Launcher.setClipboardText(text);
    setTimeout(() => {
        if (window.utools.isMacOs()) {
            window.utools.simulateKeyboardTap('v', 'command');
        } else {
            window.utools.simulateKeyboardTap('v', 'ctrl');
        }
        setTimeout(this.callback, 20);
    }, 10);
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

export { AutoTypeEmitter };
