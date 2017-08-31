import DashboardSwarmNode from './DashboardSwarmNode';
import DashboardSwarmWebSocket from './DashboardSwarmWebSocket';
import WindowsManager from "./WindowsManager";

class DashboardSwarmListener {

    constructor() {
        if (!DashboardSwarmListener.instance) {

            DashboardSwarmWebSocket.getWebSocketReady().then(function (ws) {
                ws.on('data', function (message) {
                    console.log("DashboardSwarmListener received data");
                    try {
                        let data = JSON.parse(message);

                        switch (true) {
                            case data.hasOwnProperty('cmd'):
                                handleCommand(data);
                            break;

                            case data.hasOwnProperty('event'):
                                handleEvent(data);
                                break;

                            case data.hasOwnProperty('err'):
                                handleError(data);
                            break;
                        }

                    } catch (err) {
                        console.log(err);
                    }
                })
            });

            DashboardSwarmListener.instance = this;
        }
        return DashboardSwarmListener.instance;
    }
}

function handleCommand(data) {
    switch (data.cmd) {
        case 'openTab':
            if (DashboardSwarmNode.isMaster()) {
                WindowsManager.openTab(data.args[0], data.args[1]).then(function (tabId) {
                    DashboardSwarmWebSocket.sendEvent('tabOpened', [
                        tabId, // id returned by the WM
                        data.args[0], // args from the emited command, 0 is the screen ; openTab(screen, url)
                        data.args[1] // args from the emited command, 1 is the url ; openTab(screen, url)
                    ]);
                });
            }
        break;

        case 'closeTab':
            if (DashboardSwarmNode.isMaster()) {
                WindowsManager.closeTab(data.args[0]).then(function (tabId) {
                    DashboardSwarmWebSocket.sendEvent('tabClosed', [tabId]);
                });
            }
        break;
    }
}

function handleEvent(data) {
    switch (data.event) {
        case 'tabOpened':
            DashboardSwarmNode.getTabs()[data.args[0]];
        break;

        case 'tabOpened':
            DashboardSwarmNode.getTabs();
            break;

        case 'serverTabs':
            DashboardSwarmNode.setTabs(data.args.tabs);
        break;
    }
}

function handleError(data) {
    console.log(data.err);
}

const instance = new DashboardSwarmListener();
Object.freeze(instance.instance);

export default instance;