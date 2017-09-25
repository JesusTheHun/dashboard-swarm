import defer from '../function/defer';
import Rx from 'rxjs/Rx';

const WebSocketClient = require('websocket').w3cwebsocket;
const WebSocketConnection = require('websocket').connection;
const reconnectIntervalDelay = 5000;

class DashboardSwarmWebSocket {

    constructor() {
        if (!DashboardSwarmWebSocket.instance) {
            DashboardSwarmWebSocket.instance = this;

            this.wsReady = new defer();
            this.wsSubject = new Rx.BehaviorSubject(null);

            this.getWebSocketSubject().subscribe(ws => {
                if (ws === null) return;

                this.reconnectionInterval = setInterval(() => {
                    if (this.ws.readyState === WebSocket.CLOSED) {
                        this.connect();
                    }
                }, reconnectIntervalDelay);
            });
        }
        return DashboardSwarmWebSocket.instance;
    }

    /**
     * Establish WebSocket connection with stored configuration. Will close any previous connection
     */
    connect() {

        if (this.ws) {
            this.ws.close();
            this.wsReady = new defer();
        }

        let ws = new WebSocketClient('ws://' + this.serverUrl);
        ws.onopen = () => {
            this.wsReady.resolve(ws);
            this.wsSubject.next(ws);
        };

        if (typeof this.serverErrorHandler === 'function') {
            ws.onerror = err => {
                this.serverErrorHandler.call(this, err);
            };
        }

        this.ws = ws;
    }

    /**
     * Set the WebSocket server url and error handler
     * @param {string} url
     * @param {function} errorCallback
     */
    setServerConfig(url, errorCallback) {
        this.serverUrl = url;
        this.serverErrorHandler = errorCallback;
    }

    /**
     * @returns {Promise<Socket>} A promise resolved with a connected WebSocket
     */
    getWebSocketReady() {
        return this.wsReady;
    }

    getWebSocketSubject() {
        return this.wsSubject;
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