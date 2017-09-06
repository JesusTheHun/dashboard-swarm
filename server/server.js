const WebSocket = require('ws');
const fs = require('fs');

let wss;
let storageFilePath = 'storage.json';
let storage;

fs.readFile(storageFilePath, (err, storageContent) => {
    if (err) throw err;

    storage = JSON.parse(storageContent);

    wss = new WebSocket.Server({ port: 8080 });
    wss.on('connection', function (ws, req) {
        ws.on('message', function (message) {
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

                        case 'getDisplays':
                            broadcast(message);
                        break;
                    }
                }

                if (data.hasOwnProperty('event')) {
                    broadcast(message);

                    switch (data.event) {
                        case 'tabOpened':
                            if (storage.tabs === undefined) {
                                storage.tabs = [];
                            }

                            storage.tabs.push({
                                id: data.args[0],
                                screen: data.args[1],
                                url: data.args[2]
                            });

                            console.log("Tab opened, new storage :");
                            console.log(storage);

                            writeStorage();
                        break;

                        case 'tabClosed':
                            if (storage.tabs === undefined) {
                                storage.tabs = [];
                            }

                            let tabIndex = storage.tabs.find(tab => tab.id === data.args[0]);
                            delete storage.tabs[tabIndex];
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
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}