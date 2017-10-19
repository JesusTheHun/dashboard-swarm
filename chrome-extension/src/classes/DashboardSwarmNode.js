import DashboardSwarmWebSocket from "./DashboardSwarmWebSocket";
import DashboardSwarmListener from "./DashboardSwarmListener";
import defer from "../function/defer";

class DashboardSwarmNode {

    constructor() {
        if (!DashboardSwarmNode.instance) {
            this.master = 0;
            this.tabs = [];
            this.displays = null;

            let node = this;

            DashboardSwarmListener.subscribeCommand('updateTab', (tabId, newProps) => {
                if (newProps.title !== undefined) {
                    DashboardSwarmWebSocket.sendEvent('tabUpdated', [tabId, newProps]);
                }
            });

            DashboardSwarmListener.subscribeEvent('serverTabs', tabs => {
                node.tabs = tabs;
                chrome.runtime.sendMessage({ target: 'popup', action: 'getTabs', data: tabs});
            });

            DashboardSwarmListener.subscribeEvent('masterDisplays', displays => {
                node.displays = displays;
            });

            DashboardSwarmListener.subscribeEvent('tabOpened', (id, display, url, title, position, isFlash, zoom, scroll) => {
                let tab = {
                    id: id,
                    display: display,
                    url: url,
                    title: title,
                    position: position,
                    isFlash: isFlash,
                    zoom: zoom,
                    scroll: scroll
                };
                node.tabs.push(tab);
                chrome.runtime.sendMessage({ target: 'popup', action: 'tabOpened', data: tab});
            });

            DashboardSwarmListener.subscribeEvent('tabClosed', tabId => {
                let tabIdx = node.getTabs().findIndex(t => t.id === tabId);
                if (tabIdx === -1) {
                    return;
                }
                node.tabs.splice(tabIdx, 1);
                chrome.runtime.sendMessage({ target: 'popup', action: 'tabClosed', data: tabId});
            });

            DashboardSwarmListener.subscribeEvent('tabUpdated', (tabId, newProps) => {
                let currentTab = node.getTabs().find(t => t.id === tabId);
                if (currentTab === undefined) {
                    return;
                }
                Object.assign(currentTab, newProps);
                chrome.runtime.sendMessage({ target: 'popup', action: 'tabUpdated', data: [tabId, newProps]});
            });

            DashboardSwarmListener.subscribeEvent('rotationStarted', interval => {
                chrome.runtime.sendMessage({ target: 'popup', action: 'rotationStarted', data: [interval]});
            });

            DashboardSwarmListener.subscribeEvent('rotationStopped', () => {
                chrome.runtime.sendMessage({ target: 'popup', action: 'rotationStopped', data: []});
            });

            DashboardSwarmListener.subscribeEvent('rotationStatus', isPlaying => {
                chrome.runtime.sendMessage({ target: 'popup', action: 'rotationStatus', data: isPlaying});
            });

            /**
             * Bridge for the popup
             */
            chrome.runtime.onMessage.addListener(request => {
                if (request.hasOwnProperty('node') && typeof node[request.node] === 'function') {
                    let result = node[request.node].apply(node, request.args);
                    chrome.runtime.sendMessage({
                        target: 'popup',
                        action: request.node,
                        data: result
                    });
                }
            });

            this.refresh();

            DashboardSwarmNode.instance = this;
        }

        return DashboardSwarmNode.instance;
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
        DashboardSwarmWebSocket.sendCommand('getTabs');
        DashboardSwarmWebSocket.sendCommand('getDisplays');
    }

    /**
     * Ask to open a new tab
     * @param {number} display index
     * @param {string} tabUrl the urb of the tab you want to open
     * @param {string} isFlash If true the tab will be automatically removed after programmed delay
     */
    openTab(display, tabUrl, isFlash) {
        DashboardSwarmWebSocket.sendCommand('openTab', [display, tabUrl, isFlash]);
    }

    /**
     * Ask to close a tab based on its id
     * @param {number} tabId
     */
    closeTab(tabId) {
        DashboardSwarmWebSocket.sendCommand('closeTab', [tabId]);
    }

    /**
     * Ask to update the tab
     * @param {number} tabId
     * @param {*} newProps
     */
    updateTab(tabId, newProps) {
        DashboardSwarmWebSocket.sendCommand('updateTab', [tabId, newProps]);
    }

    /**
     * @returns {Array} A copy of node's tabs.
     */
    getTabs() {
        return this.tabs.slice(0);
    }

    /**
     * @returns {*} A copy of displays details
     */
    getDisplays() {
        return Object.assign({}, this.displays);
    }

    startRotation(interval) {
        DashboardSwarmWebSocket.sendCommand('startRotation', [interval]);
    }

    stopRotation() {
        DashboardSwarmWebSocket.sendCommand('stopRotation');
    }

    getRotationStatus() {
        DashboardSwarmWebSocket.sendCommand('getRotationStatus');
    }

    reloadTab(tabId) {
        DashboardSwarmWebSocket.sendCommand('reloadTab', [tabId]);
    }
}

const instance = new DashboardSwarmNode();
Object.freeze(instance.instance);

export default instance;