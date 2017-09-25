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
    DashboardSwarmWebSocket.setServerConfig(items.server, err => {
        chrome.browserAction.setBadgeText({"text": "ERR"});
    });
    DashboardSwarmWebSocket.connect();
});

DashboardSwarmWebSocket.getWebSocketSubject().subscribe(ws => {
    if (ws === null) return;
    chrome.browserAction.setBadgeText({"text": "ON"});

    ws.onclose = () => {
        chrome.browserAction.setBadgeText({"text": "OFF"});
    };
});
