const Socket = require('simple-websocket');

class DashboardSwarmWebSocket {

    constructor() {
        if (!DashboardSwarmWebSocket.instance) {

            this.onOpenCallbacks = [];
            this.onCloseCallbacks = [];
            this.onErrorCallbacks = [];
            this.onDataCallbacks = [];

            DashboardSwarmWebSocket.instance = this;
        }
        return DashboardSwarmWebSocket.instance;
    }

    setServerUrl(url) {
        if (this.ws !== undefined) {
            this.ws.destroy();
        }

        this.ws = new Socket('ws://' + url);

        let ds = this;

        this.ws.on('connect', function () {
            for (let i in ds.onOpenCallbacks) {
                ds.onOpenCallbacks[i].call(ds);
            }
        });

        this.ws.on('close', function () {
            for (let i in ds.onCloseCallbacks) {
                ds.onCloseCallbacks[i].call(ds);
            }
        });

        this.ws.on('error', function (err) {
            for (let i in ds.onErrorCallbacks) {
                ds.onErrorCallbacks[i].call(ds, err);
            }
        });

        this.ws.on('data', function (data) {
            for (let i in ds.onDataCallbacks) {
                ds.onDataCallbacks[i].call(ds, data);
            }
        })
    }

    onOpen(callback) {
        this.onOpenCallbacks.push(callback);
    }

    onClose(callback) {
        this.onCloseCallbacks.push(callback);
    }

    onError(callback) {
        this.onErrorCallbacks.push(callback);
    }

    onData(callback) {
        this.onDataCallbacks.push(callback);
    }

    getWebSocket() {
        return this.ws;
    }

    sendCommand(cmd, args) {
        let data = {};
        data.cmd = cmd;

        if (args !== undefined) {
            data.args = args;
        }

        console.log(this);

        this.onOpen(function () {
            this.ws.send(JSON.stringify(data));
        });
    }
}

const instance = new DashboardSwarmWebSocket();
Object.freeze(instance.instance);

export default instance;