import { DashboardSwarmNode } from './src/classes/DashboardSwarmNode';
import { DashboardSwarmWebSocket } from './src/classes/DashboardSwarmWebSocket';
import { DashboardSwarmListener } from './src/classes/DashboardSwarmListener';
import { WindowsManager } from './src/classes/WindowsManager';
import { Parameters } from './src/classes/Parameters';

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

    let dsws = new DashboardSwarmWebSocket();
    let listener = new DashboardSwarmListener(dsws);
    let param =  new Parameters(listener);
    let wm =  new WindowsManager(listener);
    let node = new DashboardSwarmNode(dsws, listener, wm, param);

    node.setMaster(items.master);
    node.setServerUrl(items.server);

    dsws.getWebSocketSubject().subscribe(ws => {
        if (ws === null) return;

        chrome.browserAction.setBadgeText({"text": "ON"});

        ws.onclose = () => {
            chrome.browserAction.setBadgeText({"text": "OFF"});
        };
    });

    dsws.setServerConnectionErrorHandler(err => {
        logger.error(err);
        chrome.browserAction.setBadgeText({"text": "ERR"});
    });

    dsws.connect();

    // Restore closed connection
    setInterval(() => {
        let ws = dsws.getWebSocketSubject().getValue();
        if (!ws || ws.readyState === WebSocket.CLOSED) {
            logger.info("retrying connection...");
            dsws.connect();
        }
    }, 10000);
});