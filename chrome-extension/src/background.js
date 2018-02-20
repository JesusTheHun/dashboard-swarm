import { DashboardSwarmNode } from './classes/DashboardSwarmNode';
import { DashboardSwarmWebSocket } from './classes/DashboardSwarmWebSocket';
import { DashboardSwarmListener } from './classes/DashboardSwarmListener';
import { WindowsManager } from './classes/WindowsManager';
import { Parameters } from './classes/Parameters';

import Logger from './logger';

const logger = Logger.get('background');

///////////////////////////////
// Load displays information //
///////////////////////////////

chrome.browserAction.setBadgeText({"text": "OFF"});

chrome.storage.sync.get({
    server: 'localhost:8080',
    master: false
}, function(items) {
    logger.debug("config loaded");
    logger.debug(items);

    // Bootstrap app //

    let ws = new DashboardSwarmWebSocket();
    let listener = new DashboardSwarmListener(ws);
    let param =  new Parameters(listener);
    let node = new DashboardSwarmNode(ws, listener, param);
    let wm =  new WindowsManager(listener, node);

    node.setMaster(items.master);
    node.setServerUrl(items.server);

    chrome.storage.onChanged.addListener((changes, areaName) => {
        logger.info("config changes detected, live apply");
        console.log(changes);

        if (changes.master) {
            logger.info("This node is now master : " + (changes.master.newValue ? "yes" : "no"));
            node.setMaster(changes.master.newValue);
        }

        if (changes.server) {
            logger.info("server url changed to ` " + changes.server.newValue + "`, reconnection...");
            ws.setServerUrl(changes.server.newValue);
            ws.connect();
        }
    });

    ws.getWebSocketSubject().subscribe(ws => {
        if (ws === null) return;

        chrome.browserAction.setBadgeText({"text": "ON"});

        ws.onclose = () => {
            chrome.browserAction.setBadgeText({"text": "OFF"});
        };
    });

    ws.setServerConnectionErrorHandler(err => {
        logger.error(err);
        chrome.browserAction.setBadgeText({"text": "ERR"});
    });

    ws.connect();

    setInterval(() => {
        if (!ws || ws.readyState === WebSocket.CLOSED) {
            ws.connect();
        }
    }, 10000);
});