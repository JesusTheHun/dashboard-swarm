const WebSocket = require('ws');
const fs = require('fs');

let wss;
let storageFilePath = 'storage.json';
let storage;

fs.readFile(storageFilePath, (err, storageContent) => {
    if (err) throw err;

    storage = JSON.parse(storageContent);

    if (storage.tabs === undefined) {
        storage.tabs = [];
    }

    wss = new WebSocket.Server({ port: 8080 });
    wss.on('connection', (ws, req) => {
        ws.on('message', message => {
            console.log("Received : " + message);

            try {
                let data = JSON.parse(message);

                if (data.hasOwnProperty('cmd')) {
                    switch (data.cmd) {
                        case 'getTabs':
                            let event = {
                                event: 'serverTabs',
                                args: [storage.tabs]
                            };
                            ws.send(JSON.stringify(event));
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
                            storage.tabs.push({
                                id: data.args[0],
                                display: data.args[1],
                                url: data.args[2],
                                title: data.args[3],
                                position: data.args[4]
                            });

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
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}