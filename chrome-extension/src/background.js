import DashboardSwarmNode from './classes/DashboardSwarmNode';
import DashboardSwarmWebSocket from './classes/DashboardSwarmWebSocket';
import WindowsManager from './classes/WindowsManager';

// Import to force load
import DashboardSwarmListener from './classes/DashboardSwarmListener';

///////////////////////////////
// Load displays information //
///////////////////////////////

// swarm = new DashboardSwarm;
// wm = new WindowsManager;

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
    DashboardSwarmNode.refresh();

    ws.on('close', () => {
        chrome.browserAction.setBadgeText({"text": "OFF"});
    });
});

// Message depuis la popup
chrome.runtime.onMessage.addListener(function (request) {
    if (request.wm !== undefined) {
        WindowsManager[request.wm].call(this);
    }

    if (request.ds !== undefined) {
        DashboardSwarmNode[request.ds].apply(this, request.params);
    }
});