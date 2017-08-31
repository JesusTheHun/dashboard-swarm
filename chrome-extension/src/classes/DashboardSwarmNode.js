import DashboardSwarmWebSocket from "./DashboardSwarmWebSocket";
import WindowsManager from "./WindowsManager";

class DashboardSwarmNode {

    constructor() {
        if (!DashboardSwarmNode.instance) {
            this.master = 0;
            this.tabs = {};

            DashboardSwarmNode.instance = this;
        }

        return DashboardSwarmNode.instance;
    }

    setMaster(bool) {
        this.master = bool;
    }

    isMaster() {
        return this.master === true;
    }

    refresh() {
        DashboardSwarmWebSocket.sendCommand('getTabs');
    }

    openTab(screenIndex, tabUrl) {
        DashboardSwarmWebSocket.sendCommand('openTab', [screenIndex, tabUrl]);
    }

    closeTab(tabId) {
        DashboardSwarmWebSocket.sendCommand('closeTab', [tabId]);
    }

    setTabs(tabs) {
        this.tabs = tabs;
        WindowsManager.setTabs(tabs.map(tab => [tab.screen, tab.url]));
    }

    getTabs() {
        return this.tabs;
    }
}

const instance = new DashboardSwarmNode();
Object.freeze(instance.instance);

export default instance;