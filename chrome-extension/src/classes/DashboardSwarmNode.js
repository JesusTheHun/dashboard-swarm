/*global chrome*/

import Logger from "js-logger/src/logger";
import * as Rx from "rxjs";
import {DashboardSwarmNodeMaster} from "./DashboardSwarmNodeMaster";

const logger = Logger.get('DashboardSwarmNode');

export class DashboardSwarmNode {

    constructor(ws, listener, wm, param) {
        this.ws = ws;
        this.listener = listener;
        this.wm = wm;
        this.param = param;

        this.master = 0;
        this.masterSubject = new Rx.BehaviorSubject(null);
        this.rotation = false;
        this.connected = false;
        this.autoConnection = new Rx.BehaviorSubject(false);

        this.nodeMaster = new DashboardSwarmNodeMaster(this, listener, wm);
        this.isMasterSubject().subscribe(isMaster => {
            isMaster ? this.nodeMaster.on() : this.nodeMaster.off()
        });

        ws.getWebSocketSubject().subscribe(newConnection => {
            logger.info("new connection received", newConnection);

            if (newConnection === null) {
                this.connected = false;
                chrome.runtime.sendMessage({ target: 'popup', action: 'connectionFailed', data: []});
                return;
            }

            this.connected = true;
            this.refresh();
            chrome.runtime.sendMessage({ target: 'popup', action: 'connectionSuccess', data: []});
        });

        listener.subscribeCommand('updateTab', (tabId, newProps) => {
            if (newProps.title !== undefined) {
                ws.sendEvent('tabUpdated', [tabId, {userTitle: newProps.title}]);
            }
        });

        listener.subscribeEvent('serverTabs', tabs => {
            chrome.runtime.sendMessage({ target: 'popup', action: 'getTabs', data: tabs});
        });

        listener.subscribeEvent('masterDisplays', displays => {
            chrome.runtime.sendMessage({ target: 'popup', action: 'getDisplays', data: displays});
        });

        listener.subscribeEvent('tabOpened', (id, display, url, title, position, isFlash, zoom, scroll) => {
            let tab = {
                id: id,
                display: display,
                url: url,
                title: title,
                position: position,
                flash: isFlash,
                zoom: zoom,
                scroll: scroll
            };

            chrome.runtime.sendMessage({target: 'popup', action: 'tabOpened', data: tab});
        });

        listener.subscribeEvent('tabClosed', tabId => {
            chrome.runtime.sendMessage({ target: 'popup', action: 'tabClosed', data: tabId});
        });

        listener.subscribeEvent('tabUpdated', (tabId, newProps) => {
            chrome.runtime.sendMessage({target: 'popup', action: 'tabUpdated', data: [tabId, newProps]});
        });

        listener.subscribeEvent('rotationStarted', (display, interval, intervalFlash) => {
            chrome.runtime.sendMessage({ target: 'popup', action: 'rotationStarted', data: [display, interval, intervalFlash]});
        });

        listener.subscribeEvent('rotationStopped', () => {
            chrome.runtime.sendMessage({ target: 'popup', action: 'rotationStopped', data: []});
        });

        listener.subscribeEvent('rotationStatus', (isPlaying, interval, flashInterval) => {
            this.rotation = {
                active: isPlaying,
                interval: interval,
                flashInterval: flashInterval
            };
            chrome.runtime.sendMessage({ target: 'popup', action: 'rotationStatus', data: isPlaying});
        });

        listener.subscribeEvent('serverConfig', config => {
            chrome.runtime.sendMessage({ target: 'popup', action: 'serverConfig', data: config});
        });

        let rebootRotation = () => {
            this.stopRotation();
            this.startRotation();
        };

        param.subscribe('tabSwitchInterval', newValue => {
            if (this.rotation.active && newValue !== this.rotation.interval) {
                rebootRotation();
            }
        });

        param.subscribe('flashTabSwitchInterval', newValue => {
            if (this.rotation.active && newValue !== this.rotation.flashInterval) {
                rebootRotation();
            }
        });

        /**
         * Bridge for the popup
         */
        chrome.runtime.onMessage.addListener((request, sender, response) => {
            if (request.hasOwnProperty('node') && typeof this[request.node] === 'function') {
                let result = this[request.node].apply(this, request.args);

                // Resolve promise before sending the response through the NodeProxy
                if (result instanceof Promise) {
                    result.then(q => {
                        response(q);
                    });
                    return true;
                } else if (result instanceof Rx.BehaviorSubject) {
                    response(result.getValue());
                } else {
                    response(result);
                }
            }
        });
    }

    /**
     * Return the node's listener
     * @returns DashboardSwarmListener
     */
    getListener() {
        return this.listener;
    }

    /**
     * Define the node as master (it owns the displays)
     * @param {bool} isMaster
     */
    setMaster(isMaster) {
        logger.debug("This node is now master : " + (isMaster ? "yes" : "no"));
        this.master = isMaster;
        this.isMasterSubject().next(isMaster);
    }

    isMasterSubject() {
        return this.masterSubject;
    }

    /**
     * Return true is the node is the master node
     * @returns {boolean}
     */
    isMaster() {
        return this.master === true;
    }

    /**
     * Ask the server for its tabs and refresh the node content with it
     */
    refresh() {
        logger.debug("Refresh");
        this.ws.sendCommand('getTabs');
        this.ws.sendCommand('getDisplays');
        this.ws.sendCommand('getRotationStatus');
    }

    /**
     * Ask to open a new tab
     * @param {number} display index
     * @param {string} tabUrl the urb of the tab you want to open
     * @param {string} isFlash If true the tab will be automatically removed after programmed delay
     */
    openTab(display, tabUrl, isFlash) {
        this.ws.sendCommand('openTab', [display, tabUrl, isFlash]);
    }

    /**
     * Ask to close a tab based on its id
     * @param {number} tabId
     */
    closeTab(tabId) {
        this.ws.sendCommand('closeTab', [tabId]);
    }

    /**
     * Ask to update the tab
     * @param {number} tabId
     * @param {*} newProps
     */
    updateTab(tabId, newProps) {
        this.ws.sendCommand('updateTab', [tabId, newProps]);
    }

    getTabs() {
        this.ws.sendCommand('getTabs');
    }

    getDisplays() {
        this.ws.sendCommand('getDisplays');
    }

    getConfig() {
        this.ws.sendCommand('getConfig');
    }

    startRotation() {
        this.ws.sendCommand('startRotation', [
            this.param.getParameter('tabSwitchInterval'),
            this.param.getParameter('flashTabSwitchInterval')
        ]);
    }

    stopRotation() {
        this.ws.sendCommand('stopRotation');
    }

    getRotationStatus() {
        this.ws.sendCommand('getRotationStatus');
    }

    reloadTab(tabId) {
        this.ws.sendCommand('reloadTab', [tabId]);
    }

    sendToForeground(tabId) {
        this.ws.sendCommand('sendToForeground', [tabId]);
    }

    displayStateFullscreen(display) {
        this.ws.sendCommand('displayStateFullscreen', [display]);
    }

    restart() {
        this.ws.sendCommand('restartMaster');
    }

    connect() {
        chrome.runtime.sendMessage({ target: 'popup', action: 'connectionAttempt', data: []});
        this.autoConnection.next(true);
        this.ws.connect();
    }

    disconnect() {
        this.autoConnection.next(false);
        this.ws.close();
    }

    setServerUrl(serverUrl) {
        this.ws.setServerUrl(serverUrl);
    }

    setConfig(newConfig) {
        this.ws.sendCommand('setConfig', [newConfig]);
    }

    isConnected() {
        return this.connected;
    }
}