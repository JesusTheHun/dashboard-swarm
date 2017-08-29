const WebSocket = require('ws');
const fs = require('fs');

let wss;
let storageFilePath = 'storage.json';

fs.readFile(storageFilePath, (err, storageContent) => {
    if (err) throw err;

    let storage = JSON.parse(storageContent);

    wss = new WebSocket.Server({ port: 8080 });
    wss.on('connection', function (ws, req) {
        ws.on('message', function (message) {
            console.log("Received : " + message);

            try {
                let data = JSON.parse(message);
                broadcast(message);

                if (data.hasOwnProperty('event')) {
                    switch (data.event) {
                        case 'tabCreated':
                            if (Number.isInteger(data.args.screen) && typeof data.args.url === 'string') {
                                broadcast(message);
                                storage.tabs[data.args.screen].push(data.args.url);
                                writeStorage();
                            } else {
                                ws.send(JSON.stringify({err: "Invalid arguments for `addTab` command"}));
                            }
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
    fs.writeFile(storageFilePath, JSON.stringify(storage));
}

function broadcast(msg) {
    // On ne broadcast que les messages valides (parsable)
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}