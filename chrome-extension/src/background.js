import DashboardSwarmNode from './classes/DashboardSwarmNode';
import DashboardSwarmWebSocket from './classes/DashboardSwarmWebSocket';

// Init listeners
import WindowsManager from './classes/WindowsManager';

///////////////////////////////
// Load displays information //
///////////////////////////////

chrome.browserAction.setBadgeText({"text": "OFF"});

chrome.storage.sync.get({
    server: 'localhost:8080',
    master: false
}, function(items) {
    DashboardSwarmNode.setMaster(items.master);
    DashboardSwarmWebSocket.setServerUrl(items.server, err => {
        chrome.browserAction.setBadgeText({"text": "ERR"});
    });
});

DashboardSwarmWebSocket.getWebSocketReady().then((ws) => {
    chrome.browserAction.setBadgeText({"text": "ON"});

    ws.on('close', () => {
        chrome.browserAction.setBadgeText({"text": "OFF"});
    });
});
