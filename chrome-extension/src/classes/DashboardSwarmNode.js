import DashboardSwarmWebSocket from "./DashboardSwarmWebSocket";

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
        return this.master == 1;
    }

    refresh() {
        this.tabs = DashboardSwarmWebSocket.sendCommand('getTabs');
    }

    addTab(screenIndex, tabUrl) {
        DashboardSwarmWebSocket.sendCommand('addTab', {
            screen: screenIndex,
            url: tabUrl
        });
    }
}

const instance = new DashboardSwarmNode();
Object.freeze(instance.instance);

export default instance;