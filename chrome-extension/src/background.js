//////////////////
// Import stuff //
//////////////////

import logger from './logger';

import DashboardSwarmNode from './classes/DashboardSwarmNode';
import DashboardSwarmWebSocket from './classes/DashboardSwarmWebSocket';
import DashboardSwarmTab from '../../common/DashboardSwarmTab';

// Init listeners
import WindowsManager from './classes/WindowsManager';
import Parameters from './classes/Parameters';


///////////////////////////////
// Load displays information //
///////////////////////////////

chrome.browserAction.setBadgeText({"text": "OFF"});

chrome.storage.onChanged.addListener((changes, areaName) => {
    logger.info("config changes detected, live apply");

    if (changes.master) {
        DashboardSwarmNode.setMaster(changes.master.newValue);
    }

    if (changes.server) {
        logger.info("server url changed, reconnection...");
        DashboardSwarmWebSocket.setServerUrl(changes.server.newValue);
        DashboardSwarmWebSocket.connect();
    }
});

DashboardSwarmWebSocket.getWebSocketSubject().subscribe(ws => {
    if (ws === null) return;
    chrome.browserAction.setBadgeText({"text": "ON"});

    ws.onclose = () => {
        chrome.browserAction.setBadgeText({"text": "OFF"});
    };
});

chrome.storage.sync.get({
    server: 'localhost:8080',
    master: false
}, function(items) {
    DashboardSwarmNode.setMaster(items.master);
    DashboardSwarmWebSocket.setServerUrl(items.server);
    DashboardSwarmWebSocket.setServerConnectionErrorHandler(err => {
        chrome.browserAction.setBadgeText({"text": "ERR"});
    });
    logger.debug("config loaded");
    logger.debug(items);
    DashboardSwarmWebSocket.connect();
});