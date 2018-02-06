import defer from "../function/defer";
import Logger from "js-logger/src/logger";

const logger = Logger.get('DashboardSwarmNode');

export class DashboardSwarmNode {

    constructor(ws, listener, param) {
        this.ws = ws;
        this.dsListener = listener;
        this.param = param;

        this.master = 0;
        this.tabs = [];
        this.displays = null;
        this.rotation = false;
        this.tabsDefer = new defer();
        this.displaysDefer = new defer();

        let node = this;

        ws.getWebSocketSubject().subscribe(newConnection => {
            logger.info("new connection received");
            logger.debug(newConnection);

            this.tabsDefer = new defer();
            this.displaysDefer = new defer();

            if (newConnection === null) {
                chrome.runtime.sendMessage({ target: 'popup', action: 'connectionFailed', data: []});
                return;
            }

            node.refresh();
            chrome.runtime.sendMessage({ target: 'popup', action: 'connectionSuccess', data: []});
        });

        listener.subscribeCommand('updateTab', (tabId, newProps) => {
            if (newProps.title !== undefined) {
                ws.sendEvent('tabUpdated', [tabId, newProps]);
            }
        });

        listener.subscribeEvent('serverTabs', tabs => {
            node.tabs = tabs;
            node.tabsDefer.resolve(tabs);
            chrome.runtime.sendMessage({ target: 'popup', action: 'getTabs', data: tabs});
        });

        listener.subscribeEvent('masterDisplays', displays => {
            node.displays = displays;
            node.displaysDefer.resolve(displays);
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
            node.tabs.push(tab);
            chrome.runtime.sendMessage({target: 'popup', action: 'tabOpened', data: tab});
        });

        listener.subscribeEvent('tabClosed', tabId => {
            node.getTabs().then(tabs => {
                let tabIdx = tabs.findIndex(t => t.id === tabId);
                if (tabIdx === -1) {
                    return;
                }
                node.tabs.splice(tabIdx, 1);
                chrome.runtime.sendMessage({ target: 'popup', action: 'tabClosed', data: tabId});
            });
        });

        listener.subscribeEvent('tabUpdated', (tabId, newProps) => {
            node.getTabs().then(tabs => {
                let currentTab = tabs.find(t => t.id === tabId);
                if (currentTab === undefined) {
                    return;
                }
                Object.assign(currentTab, newProps);
                chrome.runtime.sendMessage({target: 'popup', action: 'tabUpdated', data: [tabId, newProps]});
            });
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
            if (request.hasOwnProperty('node') && typeof node[request.node] === 'function') {
                let result = node[request.node].apply(node, request.args);

                // Resolve then promise before sending the response through the NodeProxy
                if (result instanceof Promise) {
                    result.then(q => {
                        response(q);
                    });
                    return true;
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
        return this.dsListener;
    }

    /**
     * Define the node as master (it owns the displays)
     * @param {bool} bool
     */
    setMaster(bool) {
        this.master = bool;
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
        this.ws.sendCommand('getTabs');
        this.ws.sendCommand('getDisplays');
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

    /**
     * @returns {Promise<Array>} A copy of node's tabs.
     */
    getTabs() {
        return this.tabsDefer;
    }

    /**
     * @returns {Promise<*>} A copy of displays details
     */
    getDisplays() {
        return this.displaysDefer;
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
        this.ws.connect();
    }

    close() {
        this.ws.close();
    }

    setServerUrl(serverUrl) {
        this.ws.setServerUrl(serverUrl);
    }

    setConfig(newConfig) {
        this.ws.sendCommand('setConfig', [newConfig]);
    }
}