const moment = require('moment');
const WebSocketServer = require('websocket').server;
const http = require('http');
const fs = require('fs');
const Logger = require("js-logger");

let handler = Logger.createDefaultHandler({
    formatter: (messages, context) => {

        let date = new Date;
        let time = '[ ' + getCurrentDatetime() + ' ]';

        if (context.name) {
            messages.unshift('[ ' + context.name + ' ]');
        }

        messages.unshift('[ ' + context.level.name + ' ]');
        messages.unshift(time);

        if (typeof messages[0] !== 'string') {
            messages[0] = 'Object : ';
            Logger.info(messages[0]);
        }
    }
});

Logger.setHandler(handler);
Logger.setLevel(Logger.DEBUG);

const defaultConfig = {
    hostname: 'localhost',
    port: 8080
};

let storageFilePath = 'storage.json';

let config = Object.assign({}, defaultConfig);

if (process.argv[2] !== undefined) config.hostname = process.argv[2];
if (process.argv[3] !== undefined) config.port = process.argv[3];
if (process.argv[4] !== undefined) storageFilePath = process.argv[4];


let server = http.createServer((req, res) => {
    Logger.info("http connection");
    res.write("Hello.");
    res.end();
});

server.listen(config.port, config.hostname, () => {
    Logger.info("Server is listening on " + config.hostname + ":" + config.port);
});

Logger.info("Storage file : " + storageFilePath);

let wss;
let clients = [];
let storage;


fs.readFile(storageFilePath, (err, storageContent) => {
    if (err) throw err;

    let parsedStorage = JSON.parse(storageContent);
    let defaultStorage = {
        tabs: [],
        config: {
            tabSwitchInterval: 3000,
            flashTabLifetime: 24*3600,
            flashTabSwitchInterval: 8000
        }
    };

    storage = Object.assign(defaultStorage, parsedStorage);

    setInterval(removeExpiredFlashTabs, 10000, storage.tabs);

    wss = new WebSocketServer({ httpServer: server });

    wss.on('request', request => {
        Logger.info('Connection from origin ' + request.origin + '.');

        let conn = request.accept(null, request.origin);
        let clientIndex = clients.push(conn);

        Logger.info('Connection accepted.');

        conn.on('close', conn => {
            clients.splice(clientIndex, 1);
            Logger.info('Connection closed.');
        });

        conn.on('message', packet => {
            let message = packet.utf8Data;

            Logger.info("Received : " + message);

            try {
                let data = JSON.parse(message);

                if (data.hasOwnProperty('cmd')) {

                    let event;

                    switch (data.cmd) {
                        case 'getTabs':
                            event = {
                                event: 'serverTabs',
                                args: [storage.tabs]
                            };
                            Logger.info("sending tabs :");
                            Logger.info(storage.tabs);
                            conn.send(JSON.stringify(event));
                            break;

                        case 'getConfig':
                            event = {
                                event: 'serverConfig',
                                args: [storage.config]
                            };

                            conn.send(JSON.stringify(event));
                            break;

                        case 'setConfig':
                            let configUpdate = data.args[0];
                            Object.assign(storage.config, configUpdate);
                            writeStorage();

                            event = {
                                event: 'serverConfig',
                                args: [storage.config]
                            };

                            Logger.info("Broadcasting new config");

                            broadcast(JSON.stringify(event));
                            break;

                        default:
                            broadcast(message);
                            break;
                    }
                }

                if (data.hasOwnProperty('event')) {
                    broadcast(message);

                    switch (data.event) {
                        case 'tabOpened':
                            let tabToPush = {
                                id: data.args[0],
                                display: data.args[1],
                                url: data.args[2],
                                title: data.args[3],
                                position: data.args[4],
                                flash: data.args[5],
                                zoom: data.args[6],
                                scroll: data.args[7]
                            };

                            storage.tabs.push(tabToPush);

                            writeStorage();
                            break;

                        case 'tabClosed':
                            let closedTabIndex = storage.tabs.findIndex(tab => tab.id === data.args[0]);
                            if (closedTabIndex === -1) {
                                return;
                            }
                            storage.tabs.splice(closedTabIndex, 1);
                            writeStorage();
                            break;

                        case 'tabUpdated':
                            let updatedTab = storage.tabs.find(tab => tab.id === data.args[0]);
                            if (updatedTab === undefined) {
                                return;
                            }

                            Object.assign(updatedTab, data.args[1]);
                            writeStorage();
                            break;
                    }
                }

            } catch (err) {
                Logger.info(err);
            }
        });
    });

    Logger.info("Ready.");
});

function writeStorage() {
    fs.writeFile(storageFilePath, JSON.stringify(storage), err => {
        if (err) Logger.info(err);

        // Logger.info("Storage written : ");
        // Logger.info(JSON.stringify(storage));
    });
}

function broadcast(msg) {
    clients.forEach(client => {
        if (client.connected) {
            client.send(msg);
        }
    });
}

function removeExpiredFlashTabs(tabs) {
    let removedTabId = [];

    tabs.map(tab => {

        if (tab.flash !== undefined) {
            let expirationDate = moment(tab.flash).add(storage.config.flashTabLifetime, 'm').toDate();

            if (expirationDate < new Date()) {

                Logger.info("Expired flash tab detected, expiration date");
                Logger.info(expirationDate);

                removedTabId.push(tab.id);
                broadcast(JSON.stringify({
                    'cmd': 'closeTab',
                    'args': [tab.id]
                }))
            }
        }
    });

    return removedTabId;
}

function enforceDigits (number, digits) {
    let str = number.toString();

    while (str.length < digits) {
        str = '0' + str;
    }

    return str;
}

function getCurrentDatetime() {
    let date = new Date;
    return enforceDigits(date.getHours(), 2) + ':' + enforceDigits(date.getMinutes(), 2) + ':' + enforceDigits(date.getSeconds(), 2) + '.' + enforceDigits(date.getMilliseconds(), 3);
}