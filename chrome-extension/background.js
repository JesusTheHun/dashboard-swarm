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

    let ws = new DashboardSwarmWebSocket();
    let listener = new DashboardSwarmListener(ws);
    let param =  new Parameters(listener);
    let wm =  new WindowsManager(listener);
    let node = new DashboardSwarmNode(ws, listener, wm, param);

    node.setMaster(items.master);
    node.setServerUrl(items.server);

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