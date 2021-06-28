import { Events } from 'framework/events';
import { StartProfiler } from 'comp/app/start-profiler';
import { Locale } from 'util/locale';
import { Logger } from 'util/logger';
import { noop } from 'util/fn';

const logger = new Logger('launcher');

const Launcher = {
    name: 'utools',
    version: '1.0',
    autoTypeSupported: true,
    thirdPartyStoragesSupported: true,
    clipboardSupported: true,
    req(req) {
        return window.require(req);
    },
    platform() {
        return 'utools';
    },
    electron() {
        return this.req('electron');
    },
    openLink(href) {
        if (/^(http|https|ftp|sftp|mailto):/i.test(href)) {
            window.utools.shellOpenExternal(href);
        }
    },
    devTools: true,
    openDevTools() {},
    getSaveFileName(defaultPath, callback) {
        if (defaultPath) {
            const homePath = window.utools.getPath('desktop');
            defaultPath = this.joinPath(homePath, defaultPath);
        }
        callback(
            window.utools.showSaveDialog({
                title: Locale.launcherSave,
                defaultPath,
                filters: [{ name: Locale.launcherFileFilter, extensions: ['kdbx'] }]
            })
        );
    },
    getUserDataPath(fileName) {
        if (!this.userDataPath) {
            this.userDataPath = window.utools.getPath('userData');
        }
        return this.joinPath(this.userDataPath, fileName || '');
    },
    getTempPath(fileName) {
        return this.joinPath(window.utools.getPath('temp'), fileName || '');
    },
    getDocumentsPath(fileName) {
        return this.joinPath(window.utools.getPath('documents'), fileName || '');
    },
    getAppPath(fileName) {
        const dirname = window.require('path').dirname;
        return this.joinPath(dirname(window.utools.getPath('userData')), fileName || '');
    },
    getWorkDirPath(fileName) {
        return this.joinPath(window.runtime().cwd(), fileName || '');
    },
    joinPath(...parts) {
        return window.require('path').join(...parts);
    },
    writeFile(path, data, callback) {
        window.require('fs').writeFile(path, Buffer.from(data), callback);
    },
    readFile(path, encoding, callback) {
        window.require('fs').readFile(path, encoding, (err, contents) => {
            const data = typeof contents === 'string' ? contents : new Uint8Array(contents);
            callback(data, err);
        });
    },
    fileExists(path, callback) {
        const fs = window.require.fs;
        fs.access(path, fs.constants.F_OK, (err) => callback(!err));
    },
    fileExistsSync(path) {
        const fs = window.require.fs;
        return !fs.accessSync(path, fs.constants.F_OK);
    },
    deleteFile(path, callback) {
        window.require('fs').unlink(path, callback || noop);
    },
    statFile(path, callback) {
        window.require('fs').stat(path, (err, stats) => callback(stats, err));
    },
    mkdir(dir, callback) {
        const fs = window.require.fs;
        const path = window.require('path');
        const stack = [];

        const collect = function (dir, stack, callback) {
            fs.exists(dir, (exists) => {
                if (exists) {
                    return callback();
                }

                stack.unshift(dir);
                const newDir = path.dirname(dir);
                if (newDir === dir || !newDir || newDir === '.' || newDir === '/') {
                    return callback();
                }

                collect(newDir, stack, callback);
            });
        };

        const create = function (stack, callback) {
            if (!stack.length) {
                return callback();
            }

            fs.mkdir(stack.shift(), (err) => (err ? callback(err) : create(stack, callback)));
        };

        collect(dir, stack, () => create(stack, callback));
    },
    parsePath(fileName) {
        const path = window.require('path');
        return {
            path: fileName,
            dir: path.dirname(fileName),
            file: path.basename(fileName)
        };
    },
    createFsWatcher(path) {
        return window.require('fs').watch(path, { persistent: false });
    },
    loadConfig(name) {
        return new Promise((resolve, reject) => {
            resolve(window.utools.db.get(name)?.data);
        });
    },
    saveConfig(_id, data) {
        return new Promise((resolve) => {
            const last = window.utools.db.get(_id);
            if (last) {
                window.utools.db.put({ _id, data, _rev: last._rev });
            } else {
                window.utools.db.put({ _id, data });
            }
            resolve();
        });
    },
    ensureRunnable(path) {},
    preventExit(e) {
        e.returnValue = false;
        return false;
    },
    exit() {
        this.exitRequested = true;
        this.requestExit();
    },
    requestExit() {
        window.utools.hideMainWindow(true);
    },
    requestRestart() {
        this.restartPending = true;
        this.requestExit();
    },
    cancelRestart() {
        this.restartPending = false;
    },
    setClipboardText(text) {
        return window.utools.copyText(text);
    },
    getClipboardText() {
        return window.require('electron').clipboard.readText();
    },
    clearClipboardText() {
        window.require('electron').clipboard.clear();
        if (window.runtime().platform === 'linux') {
            window.require('electron').clipboard.clear('selection');
        }
    },
    quitOnRealQuitEventIfMinimizeOnQuitIsEnabled() {
        return this.platform() === 'darwin';
    },
    minimizeApp() {
        window.utools.hideMainWindow();
    },
    canDetectOsSleep() {
        return window.runtime().platform !== 'linux';
    },
    updaterEnabled() {
        return false;
    },
    getMainWindow() {},
    resolveProxy(url, callback) {},
    hideApp() {
        window.utools.hideMainWindow();
    },
    isAppFocused() {
        return false;
    },
    showMainWindow() {
        window.utools.showMainWindow();
    },
    spawn() {
        return null;
    },
    checkOpenFiles() {
        this.readyToOpenFiles = true;
        if (this.pendingFileToOpen) {
            this.openFile(this.pendingFileToOpen);
            delete this.pendingFileToOpen;
        }
    },
    openFile(file) {
        if (this.readyToOpenFiles) {
            Events.emit('launcher-open-file', file);
        } else {
            this.pendingFileToOpen = file;
        }
    },
    setGlobalShortcuts(appSettings) {
        this.remoteApp().setGlobalShortcuts(appSettings);
    }
};

Events.on('launcher-exit-request', () => {
    setTimeout(() => Launcher.exit(), 0);
});
Events.on('launcher-minimize', () => setTimeout(() => Events.emit('app-minimized'), 0));
Events.on('launcher-started-minimized', () => setTimeout(() => Launcher.minimizeApp(), 0));
Events.on('start-profile', (data) => StartProfiler.reportAppProfile(data));
Events.on('log', (e) => new Logger(e.category || 'remote-app')[e.method || 'info'](e.message));

window.launcherOpen = (file) => Launcher.openFile(file);
if (window.launcherOpenedFile) {
    logger.info('Open file request', window.launcherOpenedFile);
    Launcher.openFile(window.launcherOpenedFile);
    delete window.launcherOpenedFile;
}
window.utools.onPluginReady(() => {
    Events.emit('app-ready');
});

Window.prototype.getHost = () => {
    let host;
    let url = window.utools.getCurrentBrowserUrl();
    if (url) {
        // 处理windows获取BrowserUrl没有http前缀
        if (!/^http/.test(url)) {
            url = `http://${url}`;
        }
        host = new URL(url)?.hostname;
        if (host && /[a-zA-Z]/.test(host)) {
            host = host?.split('.').slice(-2).join('.');
        }
    }
    return host;
};

window.utools.onPluginEnter(({ code, type, payload, optional }) => {
    if (code === 'keepass') {
        window.utools.setSubInput((val) => {
            if (val) {
                document.querySelector('.list__search-field').value = val.text;
                Events.emit('add-filter', { text: val.text });
            }
        }, 'search');
        const host = window.getHost();
        if (host) {
            window.utools.setSubInputValue(host);
            window.utools.subInputSelect();
        }
    } else if (code === 'fill') {
        Window.prototype.activeApp = '';
        if (type === 'window') {
            Window.prototype.activeApp = payload?.app.split('.')[0];
        }
        Events.emit('auto-type');
    }
});
Events.on('app-ready', () =>
    setTimeout(() => {
        Launcher.checkOpenFiles();
    }, 0)
);
export { Launcher };
