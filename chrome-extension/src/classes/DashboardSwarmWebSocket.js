const Socket = require('simple-websocket');
import defer from '../function/defer';

class DashboardSwarmWebSocket {

    constructor() {
        if (!DashboardSwarmWebSocket.instance) {
            this.wsReady = new defer();
            DashboardSwarmWebSocket.instance = this;
        }
        return DashboardSwarmWebSocket.instance;
    }

    /**
     * Set the WebSocket server url and initialize a connection
     * @param {string} url
     * @param {function} errorCallback
     */
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

    /**
     * @returns {Socket} A raw WebSocket, whatever its state is (can be undefined)
     */
    getWebSocket() {
        return this.ws;
    }

    /**
     * @returns {Promise} A promise resolved with a connected WebSocket
     */
    getWebSocketReady() {
        return this.wsReady;
    }

    /**
     * Cast a command throught the WebSocket to the server
     * @param {string} cmd Command name
     * @param {Array} args Array of arguments
     */
    sendCommand(cmd, args) {
        let data = {};
        data.cmd = cmd;
        data.args = args === undefined ? [] : args;

        this.getWebSocketReady().then(function (ws) {
            ws.send(JSON.stringify(data));
        });
    }

    /**
     * Cast an event throught the WebSocket to the server
     * @param {string} event Event name
     * @param {Array} args Array of arguments
     */
    sendEvent(event, args) {
        let data = {};
        data.event = event;
        data.args = args === undefined ? [] : args;

        this.getWebSocketReady().then(function (ws) {
            ws.send(JSON.stringify(data));
        });
    }
}

const instance = new DashboardSwarmWebSocket();
Object.freeze(instance.instance);

export default instance;