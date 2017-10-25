const WebSocketServer = require('websocket').server;
const http = require('http');
const fs = require('fs');

const defaultConfig = {
    hostname: 'localhost',
    port: 8080,
    flashTabDuration: 2880
};

let config = Object.assign({}, defaultConfig);

if (process.argv[2] !== undefined) config.hostname = process.argv[2];
if (process.argv[3] !== undefined) config.port = process.argv[3];
if (process.argv[4] !== undefined) config.flashTabDuration = process.argv[4];


let server = http.createServer((req, res) => {
    console.log((new Date()) + " http connection");
    res.write("Hello.");
    res.end();
});

server.listen(config.port, config.hostname, () => {
    console.log((new Date()) + " Server is listening on " + config.hostname + ":" + config.port);
});


let wss;
let clients = [];
let storageFilePath = 'storage.json';
let storage;

fs.readFile(storageFilePath, (err, storageContent) => {
    if (err) throw err;

    let parsedStorage = JSON.parse(storageContent);
    let defaultStorage = {
        tabs: [],
        config: {}
    };

    storage = Object.assign(defaultStorage, parsedStorage);

    setInterval(removeExpiredFlashTabs, config.flashTabDuration * 1000, storage.tabs);

    wss = new WebSocketServer({ httpServer: server });

    wss.on('request', request => {
        console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

        let conn = request.accept(null, request.origin);
        let clientIndex = clients.push(conn);

        console.log((new Date()) + ' Connection accepted.');

        conn.on('close', conn => {
            clients.splice(clientIndex, 1);
        });

        conn.on('message', packet => {
            let message = packet.utf8Data;

            console.log("Received : " + message);

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
                            conn.send(JSON.stringify(event));
                        break;

                        case 'getConfig':
                            event = {
                                event: 'serverConfig',
                                args: [storage.config]
                            };
                            console.log("config send");
                            console.log(event);
                            conn.send(JSON.stringify(event));
                            break;

                        case 'config':
                            let configName = data.args[0];
                            let configValue = data.args[1];
                            storage.config[configName] = configValue;
                            writeStorage();
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
                                zoom: data.args[6],
                                scroll: data.args[7]
                            };

                            if (data.args[5] === true) {
                                let endDate = new Date();
                                endDate.setDate(endDate.getDate() + 1);
                                tabToPush.flash = endDate;
                            }

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
                console.log(err);
            }
        });
    });
});

function writeStorage() {
    fs.writeFile(storageFilePath, JSON.stringify(storage), err => {
        if (err) console.log(err);

        console.log("Storage written : ");
        console.log(JSON.stringify(storage));
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
        if (tab.flash instanceof Date && tab.flash < new Date()) {
            removedTabId.push(tab.id);
            clients.forEach(client => {
                client.send(JSON.stringify({
                    'cmd': 'closeTab',
                    'args': [tab.id]
                }));
            });
        }
    });

    return removedTabId;
}