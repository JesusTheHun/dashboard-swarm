import DashboardSwarmNode from './classes/DashboardSwarmNode';
import DashboardSwarmWebSocket from './classes/DashboardSwarmWebSocket';
import WindowsManager from './classes/WindowsManager';

///////////////////////////////
// Load displays information //
///////////////////////////////

// swarm = new DashboardSwarm;
// wm = new WindowsManager;

chrome.browserAction.setBadgeText({"text": "OFF"});

chrome.storage.sync.get({
    server: 'localhost:8080',
    master: 0
}, function(items) {
    console.log("Config loaded : ");
    console.log(items);
    DashboardSwarmNode.setMaster(items.master);
    DashboardSwarmWebSocket.setServerUrl(items.server);
    DashboardSwarmWebSocket.onOpen(function () {
        chrome.browserAction.setBadgeText({"text": "ON"});
    });
});

DashboardSwarmNode.addTab(0, "http://www.google.fr");

// Message depuis la popup
chrome.runtime.onMessage.addListener(function (request) {
    console.log(request);
    if (request.wm !== undefined) {
        WindowsManager[request.wm].call(this);
    }

    if (request.ds !== undefined) {
        DashboardSwarmNode[request.ds].apply(this, request.params);
    }
});