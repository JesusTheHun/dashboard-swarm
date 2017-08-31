const Socket = require('simple-websocket');

function defer() {
    let res, rej;

    let promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });

    promise.resolve = res;
    promise.reject = rej;

    return promise;
}

class DashboardSwarmWebSocket {

    constructor() {
        if (!DashboardSwarmWebSocket.instance) {
            this.wsReady = defer();
            DashboardSwarmWebSocket.instance = this;
        }
        return DashboardSwarmWebSocket.instance;
    }

    setServerUrl(url, errorCallback) {
        let ds = this;

        ds.ws = new Socket('ws://' + url);
        ds.ws.on('connect', () => {
            ds.wsReady.resolve(ds.ws);
        });

        if (typeof errorCallback === 'function') {
            ds.ws.on('error', err => {
                errorCallback.call(ds, err);
            });
        }
    }

    getWebSocket() {
        return this.ws;
    }

    getWebSocketReady() {
        return this.wsReady;
    }

    /**
     * Cast a command throught the websocket to the server
     * @param cmd Command name
     * @param args Array of arguments
     */
    sendCommand(cmd, args) {
        let data = {};
        data.cmd = cmd;

        if (args !== undefined) {
            data.args = args;
        }

        this.getWebSocketReady().then(function (ws) {
            ws.send(JSON.stringify(data));
        });
    }

    /**
     * Cast an event throught the websocket to the server
     * @param event Event name
     * @param args Array of arguments
     */
    sendEvent(event, args) {
        let data = {};
        data.event = event;

        if (args !== undefined) {
            data.args = args;
        }

        this.getWebSocketReady().then(function (ws) {
            ws.send(JSON.stringify(data));
        });
    }
}

const instance = new DashboardSwarmWebSocket();
Object.freeze(instance.instance);

export default instance;