let Launcher;

if (window.process && window.process.versions && window.process.versions.electron) {
    Launcher = require('./launcher-electron').Launcher;
}
if (window.utools) {
    globalThis.Buffer = window.BufferProxy;
    Launcher = require('./launcher-utools').Launcher;
}

export { Launcher };
