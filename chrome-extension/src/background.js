import DashboardSwarmNode from './classes/DashboardSwarmNode';
import DashboardSwarmWebSocket from './classes/DashboardSwarmWebSocket';
import DashboardSwarmTab from '../../common/DashboardSwarmTab';
import Logger from 'js-logger';
import { DEBUG_LEVEL } from "./env";

// Init listeners
import WindowsManager from './classes/WindowsManager';
import Parameters from './classes/Parameters';

/////////////////
// Init logger //
/////////////////

Logger.useDefaults({
    defaultLevel: DEBUG_LEVEL,
    formatter: function(messages, context) {
        let date = new Date;
        let time = '[ ' + date.getHours() +':'+ date.getMinutes() +':'+ date.getSeconds() +'.'+ date.getMilliseconds() + ' ]';

        if (context.name) {
            messages.unshift('[ ' + context.name +' ]');
        }

        messages.unshift(time);
    }
});

Logger.info("Logger loaded, log level : " + DEBUG_LEVEL);

///////////////////////////////
// Load displays information //
///////////////////////////////

chrome.browserAction.setBadgeText({"text": "OFF"});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (changes.master) {
        DashboardSwarmNode.setMaster(changes.master.newValue);
    }

    if (changes.server) {
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
    DashboardSwarmWebSocket.connect();
});