import WindowsManager from "./WindowsManager";
import Parameters from "./Parameters";
import defer from "../function/defer";
import Logger from "js-logger/src/logger";

const logger = Logger.get('DashboardSwarmNode');

export class DashboardSwarmNode {

    constructor(ws, listener) {
        this.ws = ws;
        this.dsListener = listener;

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
                return;
            }

            node.refresh();
            chrome.runtime.sendMessage({ target: 'popup', action: 'newConnection', data: []});
        });

        ws.subscribeCommand('restartMaster', () => {
            if (node.isMaster()) {
                WindowsManager.closeEverything().then(windowClosedCount => {
                    chrome.runtime.reload();
                });
            }
        });

        ws.subscribeCommand('updateTab', (tabId, newProps) => {
            if (newProps.title !== undefined) {
                ws.sendEvent('tabUpdated', [tabId, newProps]);
            }
        });

        ws.subscribeEvent('serverTabs', tabs => {
            node.tabs = tabs;
            node.tabsDefer.resolve(tabs);
            chrome.runtime.sendMessage({ target: 'popup', action: 'getTabs', data: tabs});
        });

        ws.subscribeEvent('masterDisplays', displays => {
            node.displays = displays;
            node.displaysDefer.resolve(displays);
            chrome.runtime.sendMessage({ target: 'popup', action: 'getDisplays', data: displays});
        });

        ws.subscribeEvent('tabOpened', (id, display, url, title, position, isFlash, zoom, scroll) => {
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

        ws.subscribeEvent('tabClosed', tabId => {
            node.getTabs().then(tabs => {
                let tabIdx = tabs.findIndex(t => t.id === tabId);
                if (tabIdx === -1) {
                    return;
                }
                node.tabs.splice(tabIdx, 1);
                chrome.runtime.sendMessage({ target: 'popup', action: 'tabClosed', data: tabId});
            });
        });

        ws.subscribeEvent('tabUpdated', (tabId, newProps) => {
            node.getTabs().then(tabs => {
                let currentTab = tabs.find(t => t.id === tabId);
                if (currentTab === undefined) {
                    return;
                }
                Object.assign(currentTab, newProps);
                chrome.runtime.sendMessage({target: 'popup', action: 'tabUpdated', data: [tabId, newProps]});
            });
        });

        ws.subscribeEvent('rotationStarted', (display, interval, intervalFlash) => {
            chrome.runtime.sendMessage({ target: 'popup', action: 'rotationStarted', data: [display, interval, intervalFlash]});
        });

        ws.subscribeEvent('rotationStopped', () => {
            chrome.runtime.sendMessage({ target: 'popup', action: 'rotationStopped', data: []});
        });

        ws.subscribeEvent('rotationStatus', (isPlaying, interval, flashInterval) => {
            this.rotation = {
                active: isPlaying,
                interval: interval,
                flashInterval: flashInterval
            };
            chrome.runtime.sendMessage({ target: 'popup', action: 'rotationStatus', data: isPlaying});
        });

        let rebootRotation = () => {
            this.stopRotation();
            this.startRotation();
        };

        Parameters.subscribe('tabSwitchInterval', newValue => {
            if (this.rotation.active && newValue !== this.rotation.interval) {
                rebootRotation();
            }
        });

        Parameters.subscribe('flashTabSwitchInterval', newValue => {
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

    startRotation() {
        this.ws.sendCommand('startRotation', [
            Parameters.getParameter('tabSwitchInterval'),
            Parameters.getParameter('flashTabSwitchInterval')
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
}