import logger from './logger';
import { dashboardSwarmNode, dashboardSwarmWebSocket } from './app';

///////////////////////////////
// Load displays information //
///////////////////////////////

chrome.browserAction.setBadgeText({"text": "OFF"});

chrome.storage.onChanged.addListener((changes, areaName) => {
    logger.info("config changes detected, live apply");

    if (changes.master) {
        dashboardSwarmNode.setMaster(changes.master.newValue);
    }

    if (changes.server) {
        logger.info("server url changed, reconnection...");
        dashboardSwarmWebSocket.setServerUrl(changes.server.newValue);
        dashboardSwarmWebSocket.connect();
    }
});

dashboardSwarmWebSocket.getWebSocketSubject().subscribe(ws => {
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
    dashboardSwarmNode.setMaster(items.master);
    dashboardSwarmWebSocket.setServerUrl(items.server);
    dashboardSwarmWebSocket.setServerConnectionErrorHandler(err => {
        chrome.browserAction.setBadgeText({"text": "ERR"});
    });
    logger.debug("config loaded");
    logger.debug(items);
    dashboardSwarmWebSocket.connect();
});