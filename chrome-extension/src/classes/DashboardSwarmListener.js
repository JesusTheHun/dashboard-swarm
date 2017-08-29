import DashboardSwarmWebSocket from './DashboardSwarmWebSocket';

export class DashboardSwarmListener {

    constructor() {
        DashboardSwarmWebSocket.onData(function (message) {
            console.log("DashboardSwarmListener received data : ");
            console.log(message);
            try {
                let data = JSON.parse(message);

                switch (true) {
                    case data.hasOwnProperty('cmd'):
                        handleCommand(data);
                    break;

                    case data.hasOwnProperty('err'):
                        handleError(data);
                        break;
                }

            } catch (err) {
                console.log(err);
            }
        });
    }
}

function handleError(data) {
    console.log(data.err);
}

function handleCommand(data) {
    console.log("COMMAND RECEIVED : ");
    console.log(data);
}

function addTab(screenIndex, tabUrl) {
    if (this.isMaster()) {
        WindowsManager.openTab(screenIndex, tabUrl).then(tabId => {
            tabs[tabId] = {
                id: tabId,
                screen: screenIndex,
                url: tabUrl
            };
        });
    }
}

function removeTab(tabId) {
    if (this.isMaster()) {
        WindowsManager.closeTab(tabId);
    }
}

function shutdown() {
    this.tabs = {};

    if (this.isMaster()) {
        WindowsManager.closeEverything();
    }
}