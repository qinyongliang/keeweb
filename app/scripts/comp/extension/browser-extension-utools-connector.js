import { Launcher } from 'comp/launcher';
import { Logger } from 'util/logger';
import { ProtocolImpl } from './protocol-impl';
import { RuntimeInfo } from 'const/runtime-info';
import { AppSettingsModel } from 'models/app-settings-model';
import { Features } from 'util/features';

import { ExtensionIds } from './extension-ids';
import { getProcessInfo } from './util/process-utils';
import browserExtensionInstaller from './util/browser-extension-installer';
const os = window.require('os');
const fs = window.require('fs');
const path = window.require('path');
const net = window.require('net');

const WebConnectionInfo = {
    connectionId: 1,
    extensionName: 'KeeWeb Connect',
    supportsNotifications: true
};

const SupportedExtensions = [
    { alias: 'KWC', name: 'KeeWeb Connect' },
    { alias: 'KPXC', name: 'KeePassXC-Browser' }
];
const SupportedBrowsers = ['Chrome', 'Firefox', 'Edge', 'Other'];
if (Features.isMac) {
    SupportedBrowsers.unshift('Safari');
}

const logger = new Logger('browser-extension-connector');
if (!localStorage.debugBrowserExtension) {
    logger.level = Logger.Level.Info;
}

const connections = new Map();
const pendingBrowserMessages = [];
let processingBrowserMessage = false;


const BrowserExtensionNames = {
    KWC: 'KeeWeb Connect',
    KPXC: 'KeePassXC-Browser'
};

const MaxIncomingDataLength = 10_000;
const ExtensionOrigins = {
    [ExtensionIds.Origins.KeeWebConnectSafari]: BrowserExtensionNames.KWC,
    [ExtensionIds.Origins.KeeWebConnectFirefox]: BrowserExtensionNames.KWC,
    [ExtensionIds.Origins.KeeWebConnectChrome]: BrowserExtensionNames.KWC,
    [ExtensionIds.Origins.KeeWebConnectEdge]: BrowserExtensionNames.KWC,
    [ExtensionIds.Origins.KeePassXcBrowserFirefox]: BrowserExtensionNames.KPXC,
    [ExtensionIds.Origins.KeePassXcBrowserChrome]: BrowserExtensionNames.KPXC,
    [ExtensionIds.Origins.KeePassXcBrowserEdge]: BrowserExtensionNames.KPXC
};

for (const devExtId of process.env.KEEWEB_BROWSER_EXTENSION_IDS_CHROMIUM?.split(',') || []) {
    ExtensionOrigins[`chrome-extension://${devExtId}/`] = BrowserExtensionNames.KWC;
}

const AppNames = {
    'msedge': 'Microsoft Edge',
    'chrome': 'Google Chrome'
};

let connectedSockets = new Map();
let connectedSocketState = new WeakMap();
let server;
let serverSocketName;
let socketId = 0;

const BrowserExtensionConnector = {
    started: false,
    logger,

    init(appModel) {
        const sendEvent = this.sendEvent.bind(this);
        ProtocolImpl.init({ appModel, logger, sendEvent });

        this.browserWindowMessage = this.browserWindowMessage.bind(this);

        if (Launcher) {
            AppSettingsModel.on('change', () => this.appSettingsChanged());
        }

        if (this.isEnabled()) {
            this.start();
        }
    },

    start() {
        if (Launcher) {
            this.startDesktopAppListener();
        } else {
            this.startWebMessageListener();
        }

        this.started = true;
    },

    stop() {
        if (Launcher) {
            this.stopDesktopAppListener();
        } else {
            this.stopWebMessageListener();
        }

        ProtocolImpl.cleanup();
        connections.clear();

        this.started = false;
    },

    appSettingsChanged() {
        if (this.isEnabled()) {
            if (!this.started) {
                this.start();
            }
        } else if (this.started) {
            this.stop();
        }
    },

    isEnabled() {
        if (!Launcher) {
            return true;
        }
        for (const ext of SupportedExtensions) {
            for (const browser of SupportedBrowsers) {
                if (AppSettingsModel[`extensionEnabled${ext.alias}${browser}`]) {
                    return true;
                }
            }
        }
        return false;
    },

    startWebMessageListener() {
        window.addEventListener('message', this.browserWindowMessage);
        logger.info('Started');
    },

    stopWebMessageListener() {
        window.removeEventListener('message', this.browserWindowMessage);
    },

    enable(browser, extension, enabled) {
        this.browserExtensionConnectorEnable(browser, extension, enabled);
    },

    async startDesktopAppListener() {
        this.browserExtensionConnectorStart({
            appleTeamId: RuntimeInfo.appleTeamId
        });
    },

    stopDesktopAppListener() {
        this.browserExtensionConnectorStop();
    },

    browserWindowMessage(e) {
        if (e.origin !== location.origin) {
            return;
        }
        if (e.source !== window) {
            return;
        }
        if (e?.data?.kwConnect !== 'request') {
            return;
        }
        logger.debug('Extension -> KeeWeb', e.data);
        pendingBrowserMessages.push(e.data);
        this.processBrowserMessages();
    },

    async processBrowserMessages() {
        if (!pendingBrowserMessages.length || processingBrowserMessage) {
            return;
        }

        if (!connections.has(WebConnectionInfo.connectionId)) {
            connections.set(WebConnectionInfo.connectionId, WebConnectionInfo);
        }

        processingBrowserMessage = true;

        const request = pendingBrowserMessages.shift();

        const response = await ProtocolImpl.handleRequest(request, WebConnectionInfo);

        processingBrowserMessage = false;

        if (response) {
            this.sendWebResponse(response);
        }

        this.processBrowserMessages();
    },

    sendWebResponse(response) {
        logger.debug('KeeWeb -> Extension', response);
        response.kwConnect = 'response';
        postMessage(response, window.location.origin);
    },

    sendSocketEvent(data) {
        this.browserExtensionConnectorSocketEvent(data);
    },

    sendSocketResult(socketId, data) {
        this.browserExtensionConnectorSocketResult(socketId, data);
    },

    sendEvent(data) {
        if (!this.isEnabled() || !connections.size) {
            return;
        }
        if (Launcher) {
            this.sendSocketEvent(data);
        } else {
            this.sendWebResponse(data);
        }
    },

    socketConnected(socketId, connectionInfo) {
        connections.set(socketId, connectionInfo);
    },

    socketClosed(socketId) {
        connections.delete(socketId);
        ProtocolImpl.deleteConnection(socketId);
    },

    async socketRequest(socketId, request) {
        let result;

        const connectionInfo = connections.get(socketId);
        if (connectionInfo) {
            result = await ProtocolImpl.handleRequest(request, connectionInfo);
        } else {
            const message = `Connection not found: ${socketId}`;
            result = ProtocolImpl.errorToResponse({ message }, request);
        }

        this.sendSocketResult(socketId, result);
    },

    get sessions() {
        return ProtocolImpl.sessions;
    },

    terminateConnection(connectionId) {
        connectionId = +connectionId;
        if (Launcher) {
            this.browserExtensionConnectorCloseSocket(connectionId);
        } else {
            ProtocolImpl.deleteConnection(connectionId);
        }
    },

    getClientPermissions(clientId) {
        return ProtocolImpl.getClientPermissions(clientId);
    },

    setClientPermissions(clientId, permissions) {
        ProtocolImpl.setClientPermissions(clientId, permissions);
    },

    async browserExtensionConnectorStart(config) {
        serverSocketName = this.getBrowserExtensionSocketName(config);
        await this.prepareBrowserExtensionSocket();

        if (isSocketNameTooLong(serverSocketName)) {
            logger.error(
                "Socket name is too long, browser connection won't be possible, probably OS username is very long.",
                serverSocketName
            );
            return;
        }

        server = net.createServer(async (socket) => {
            socketId++;

            logger.info(`New connection with socket ${socketId}`);

            connectedSockets.set(socketId, socket);
            connectedSocketState.set(socket, { socketId });

            socket.on('data', (data) => onSocketData(socket, data));
            socket.on('close', () => onSocketClose(socket));
        });
        server.listen(serverSocketName);

        logger.info('Started');
    },

    browserExtensionConnectorStop() {
        for (const socket of connectedSockets.values()) {
            socket.destroy();
        }
        if (server) {
            server.close();
            server = null;
        }
        connectedSockets = new Map();
        connectedSocketState = new WeakMap();

        logger.info('Stopped');
    },

    async browserExtensionConnectorEnable(browser, extension, enabled) {
        logger.info(enabled ? 'Enable' : 'Disable', browser, extension);

        try {
            if (enabled) {
                await browserExtensionInstaller.install(browser, extension);
            } else {
                await browserExtensionInstaller.uninstall(browser, extension);
            }
        } catch (e) {
            logger.error(`Error installing extension: ${e}`);
        }
    },

    browserExtensionConnectorSocketResult(socketId, result) {
        this.sendResultToSocket(socketId, result);
    },

    browserExtensionConnectorSocketEvent(data) {
        this.sendEventToAllSockets(data);
    },

    browserExtensionConnectorCloseSocket(socketId) {
        const socket = connectedSockets.get(socketId);
        socket?.destroy();
    },

    getBrowserExtensionSocketName(config) {
        const { username, uid } = os.userInfo();
        if (process.platform === 'darwin') {
            const appleTeamId = config.appleTeamId;
            return `/Users/${username}/Library/Group Containers/${appleTeamId}.keeweb/conn.sock`;
        } else if (process.platform === 'win32') {
            return `\\\\.\\pipe\\keeweb-connect-${username}`;
        } else {
            const sockFileName = `keeweb-connect-${uid}.sock`;
            return path.join(window.utools.getPath('temp'), sockFileName);
        }
    },

    prepareBrowserExtensionSocket() {
        return new Promise((resolve) => {
            if (process.platform === 'darwin') {
                fs.access(serverSocketName, fs.constants.F_OK, (err) => {
                    if (err) {
                        const dir = path.dirname(serverSocketName);
                        fs.mkdir(dir, () => resolve());
                    } else {
                        fs.unlink(serverSocketName, () => resolve());
                    }
                });
            } else if (process.platform === 'win32') {
                return resolve();
            } else {
                fs.unlink(serverSocketName, () => resolve());
            }
        });
    },

    isSocketNameTooLong(socketName) {
        const maxLength = process.platform === 'win32' ? 256 : 104;
        return socketName.length > maxLength;
    },

    onSocketClose(socket) {
        const state = connectedSocketState.get(socket);
        connectedSocketState.delete(socket);

        if (state?.socketId) {
            connectedSockets.delete(state.socketId);
            this.socketClosed(state.socketId);
        }

        logger.info(`Socket ${state?.socketId} closed`);
    },

    onSocketData(socket, data) {
        const state = connectedSocketState.get(socket);
        if (!state) {
            logger.warn('Received data without connection state');
            return;
        }

        if (data.byteLength > MaxIncomingDataLength) {
            logger.warn(`Too many bytes rejected from socket ${state.socketId}`, data.byteLength);
            socket.destroy();
            return;
        }
        if (state.pendingData) {
            state.pendingData = Buffer.concat([state.pendingData, data]);
        } else {
            state.pendingData = data;
        }
        this.processPendingSocketData(socket);
    },

    async processPendingSocketData(socket) {
        const state = connectedSocketState.get(socket);
        if (!state) {
            return;
        }
        if (!state.pendingData || state.processingData) {
            return;
        }

        if (state.pendingData.length < 4) {
            return;
        }

        const lengthBuffer = state.pendingData.buffer.slice(
            state.pendingData.byteOffset,
            state.pendingData.byteOffset + 4
        );
        const length = new Uint32Array(lengthBuffer)[0];

        if (length > MaxIncomingDataLength) {
            logger.warn(`Large message rejected from socket ${state.socketId}`, length);
            socket.destroy();
            return;
        }

        if (state.pendingData.byteLength < length + 4) {
            return;
        }

        const messageBytes = state.pendingData.slice(4, length + 4);
        if (state.pendingData.byteLength > length + 4) {
            state.pendingData = state.pendingData.slice(length + 4);
        } else {
            state.pendingData = null;
        }

        const str = messageBytes.toString();
        let request;
        try {
            request = JSON.parse(str);
        } catch {
            logger.warn(`Failed to parse message from socket ${state.socketId}`, str);
            socket.destroy();
            return;
        }

        if (!state.active) {
            await this.processFirstMessageFromSocket(socket, request);
            return;
        }

        logger.debug(`Extension[${state.socketId}] -> KeeWeb`, request);

        if (!request) {
            logger.warn(`Empty request for socket ${state.socketId}`, request);
            socket.destroy();
            return;
        }

        if (request.clientID) {
            const clientId = request.clientID;
            if (!state.clientId) {
                state.clientId = clientId;
            } else if (state.clientId !== clientId) {
                logger.warn(
                    `Changing client ID for socket ${state.socketId} is not allowed`,
                    `${state.clientId} => ${clientId}`
                );
                socket.destroy();
                return;
            }
        } else {
            if (request.action !== 'ping') {
                logger.warn(`Empty client ID in socket request ${state.socketId}`, request);
                socket.destroy();
                return;
            }
        }

        state.processingData = true;
        this.socketRequest(state.socketId, request);
    },

    async processFirstMessageFromSocket(socket, message) {
        const state = connectedSocketState.get(socket);
        if (!state) {
            return;
        }

        logger.debug(`Init connection ${state.socketId}`, message);

        state.processingData = true;

        if (!message.origin) {
            logger.error('Empty origin');
            socket.destroy();
            return;
        }
        if (!message.pid) {
            logger.error('Empty pid');
            socket.destroy();
            return;
        }

        const extensionName = ExtensionOrigins[message.origin] || 'unknown';
        const isSafari = message.origin === ExtensionIds.Origins.KeeWebConnectSafari;
        let appName;

        if (isSafari) {
            appName = 'Safari';
        } else {
            if (!message.ppid) {
                logger.error('Empty ppid');
                socket.destroy();
                return;
            }

            let parentProcessInfo;
            try {
                try {
                    parentProcessInfo = await getProcessInfo(message.ppid);
                } catch (e) {
                    logger.error(`Cannot get info for PID ${message.ppid}: ${e}`);
                    throw e;
                }

                if (process.platform === 'win32' && parentProcessInfo.appName === 'cmd') {
                    try {
                        parentProcessInfo = await getProcessInfo(parentProcessInfo.ppid);
                    } catch (e) {
                        logger.error(
                            `Cannot get info for PID ${parentProcessInfo.ppid}: ${e}, assuming cmd is the launcher`
                        );
                    }
                }
            } catch (e) {
                logger.warn('Cannot get process info, assuming the connection is not identified');
            }

            appName = parentProcessInfo
                ? AppNames[parentProcessInfo.appName] ?? parentProcessInfo.appName
                : 'Unidentified browser';
            appName = appName[0].toUpperCase() + appName.substr(1);
        }

        state.active = true;
        state.appName = appName;
        state.extensionName = extensionName;
        state.pid = message.pid;
        state.ppid = message.ppid;
        state.supportsNotifications = !isSafari;
        state.processingData = false;

        logger.info(
            `Socket ${state.socketId} activated for ` +
                `app: "${state.appName}", ` +
                `extension: "${state.extensionName}", ` +
                `pid: ${state.pid}, ` +
                `ppid: ${state.ppid}`
        );

        this.socketConnected(socketId, {
            connectionId: state.socketId,
            appName: state.appName,
            extensionName: state.extensionName,
            pid: state.pid,
            supportsNotifications: state.supportsNotifications
        });

        this.processPendingSocketData(socket);
    },

    sendResultToSocket(socketId, result) {
        const socket = connectedSockets.get(socketId);
        if (socket) {
            this.sendMessageToSocket(socket, result);
            const state = connectedSocketState.get(socket);
            if (state.processingData) {
                state.processingData = false;
                this.processPendingSocketData(socket);
            }
        }
    },

    sendEventToAllSockets(data) {
        for (const socket of connectedSockets.values()) {
            const state = connectedSocketState.get(socket);
            if (state?.active && state?.supportsNotifications) {
                this.sendMessageToSocket(socket, data);
            }
        }
    },

    sendMessageToSocket(socket, message) {
        const state = connectedSocketState.get(socket);
        if (!state) {
            logger.warn('Ignoring a socket message without connection state');
            return;
        }
        if (!state.active) {
            logger.warn(`Ignoring a message to inactive socket ${state.socketId}`);
            return;
        }

        logger.debug(`KeeWeb -> Extension[${state.socketId}]`, message);

        const responseData = Buffer.from(JSON.stringify(message));
        const lengthBuf = Buffer.from(new Uint32Array([responseData.byteLength]).buffer);
        const lengthBytes = Buffer.from(lengthBuf);
        const data = Buffer.concat([lengthBytes, responseData]);

        socket.write(data);
    }
};


export { BrowserExtensionConnector, SupportedExtensions, SupportedBrowsers };
