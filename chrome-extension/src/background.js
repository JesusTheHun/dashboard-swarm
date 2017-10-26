import DashboardSwarmNode from './classes/DashboardSwarmNode';
import DashboardSwarmWebSocket from './classes/DashboardSwarmWebSocket';

// Init listeners
import WindowsManager from './classes/WindowsManager';

///////////////////////////////
// Load displays information //
///////////////////////////////

chrome.browserAction.setBadgeText({"text": "OFF"});

chrome.storage.onChanged.addListener((changes, areaName) => {
    reloadConfig();
});

reloadConfig();

DashboardSwarmWebSocket.getWebSocketSubject().subscribe(ws => {
    if (ws === null) return;
    chrome.browserAction.setBadgeText({"text": "ON"});

    ws.onclose = () => {
        chrome.browserAction.setBadgeText({"text": "OFF"});
    };
});

function reloadConfig() {
    chrome.storage.sync.get({
        server: 'localhost:8080',
        master: false
    }, function(items) {
        DashboardSwarmNode.setMaster(items.master);
        DashboardSwarmWebSocket.setServerUrl(items.server);
        DashboardSwarmWebSocket.setServerConnectionErrorHandler(err => {
            chrome.browserAction.setBadgeText({"text": "ERR"});
        });
        DashboardSwarmWebSocket.connect();
    });
}