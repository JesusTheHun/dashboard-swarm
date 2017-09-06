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

            DashboardSwarmListener.subscribeEvent('serverTabs', tabs => {
                node.setTabs(tabs);
            });

            DashboardSwarmListener.subscribeEvent('masterDisplays', displays => {
                node.displays = displays;
            });

            DashboardSwarmListener.subscribeEvent('tabOpened', tab => {
                node.getTabs().push(tab);
            });

            DashboardSwarmListener.subscribeEvent('tabClosed', tab => {
                let tabIdx = node.getTabs().find(t => t.id === tab.id);
                delete node.tabs[tabIdx];
            });


            /**
             * Bridge for the popup
             */
            chrome.runtime.onMessage.addListener(request => {
                if (request.hasOwnProperty('node') && typeof node[request.node] === 'function') {
                    chrome.runtime.sendMessage({
                        target: 'popup',
                        action: request.node,
                        data: node[request.node].apply(node, request.args)
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
     */
    openTab(display, tabUrl) {
        DashboardSwarmWebSocket.sendCommand('openTab', [display, tabUrl]);
    }

    /**
     * Ask to close a tab based on its id
     * @param tabId
     */
    closeTab(tabId) {
        DashboardSwarmWebSocket.sendCommand('closeTab', [tabId]);
    }

    /**
     * Set node tabs. Do no reflect on the WindowManager
     * @param {array} tabs
     */
    setTabs(tabs) {
        this.tabs = tabs;
    }

    /**
     * Return the node tabs
     * @returns {array} tabs
     */
    getTabs() {
        return this.tabs;
    }

    getDisplays() {
        return this.displays;
    }
}

const instance = new DashboardSwarmNode();
Object.freeze(instance.instance);

export default instance;