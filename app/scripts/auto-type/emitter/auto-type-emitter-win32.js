import { AutoTypeNativeHelper } from 'auto-type/helper/auto-type-native-helper';
import { Launcher } from 'comp/launcher';

// https://msdn.microsoft.com/en-us/library/windows/desktop/dd375731(v=vs.85).aspx
const KeyMap = {
    tab: 0x09,
    enter: 0x0d,
    space: 0x20,
    up: 0x26,
    down: 0x28,
    left: 0x25,
    right: 0x27,
    home: 0x24,
    end: 0x23,
    pgup: 0x21,
    pgdn: 0x22,
    ins: 0x2d,
    del: 0x2e,
    bs: 0x08,
    esc: 0x1b,
    win: 0x5b,
    rwin: 0x5c,
    f1: 0x70,
    f2: 0x71,
    f3: 0x72,
    f4: 0x73,
    f5: 0x74,
    f6: 0x75,
    f7: 0x76,
    f8: 0x77,
    f9: 0x78,
    f10: 0x79,
    f11: 0x7a,
    f12: 0x7b,
    f13: 0x7c,
    f14: 0x7d,
    f15: 0x7e,
    f16: 0x7f,
    add: 0x6b,
    subtract: 0x6d,
    multiply: 0x6a,
    divide: 0x6f,
    n0: 0x30,
    n1: 0x31,
    n2: 0x32,
    n3: 0x33,
    n4: 0x34,
    n5: 0x35,
    n6: 0x36,
    n7: 0x37,
    n8: 0x38,
    n9: 0x39
};

const ModMap = {
    '^': '^',
    '+': '+',
    '%': '%',
    '^^': '^'
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
        this.pendingScript.push('text ' + this.modStr() + ' ' + text);
    }
    this.callback();
};

AutoTypeEmitter.prototype.key = function (key) {
    if (typeof key !== 'number') {
        if (!KeyMap[key]) {
            return this.callback('Bad key: ' + key);
        }
        key = KeyMap[key];
    }
    this.pendingScript.push('key ' + this.modStr() + key);
    this.callback();
};

AutoTypeEmitter.prototype.copyPaste = function (text) {
    this.pendingScript.push('copypaste ' + text);
    this.callback();
};

AutoTypeEmitter.prototype.wait = function (time) {
    this.pendingScript.push('wait ' + time);
    this.callback();
};

AutoTypeEmitter.prototype.waitComplete = function () {
    if (this.pendingScript.length) {
        const script = this.pendingScript.join('\n');
        this.pendingScript.length = 0;
        this.runScript(script);
    } else {
        this.callback();
    }
};

AutoTypeEmitter.prototype.setDelay = function (delay) {
    this.delay = delay || 0;
    this.callback('Not implemented');
};

AutoTypeEmitter.prototype.modStr = function () {
    return Object.keys(this.mod).join('');
};

AutoTypeEmitter.prototype.runScript = function (script) {
    Launcher.spawn({
        cmd: AutoTypeNativeHelper.getHelperPath(),
        data: script,
        complete: this.callback
    });
};

export { AutoTypeEmitter };
