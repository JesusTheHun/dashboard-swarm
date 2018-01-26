import defer from '../function/defer';
import Rx from 'rxjs/Rx';
import Logger from "js-logger/src/logger";

const WebSocketClient = require('websocket').w3cwebsocket;
const reconnectIntervalDelay = 10000;

const logger = Logger.get('DashboardSwarmWebSocket');

export class DashboardSwarmWebSocket {

    constructor() {
        this.wsReady = new defer();
        this.wsSubject = new Rx.BehaviorSubject(null);

        this.getWebSocketSubject().subscribe(ws => {
            logger.debug("new WebSocket received");
            logger.debug(ws);

            if (ws !== null) return;

            this.reconnectionInterval = setInterval(() => {
                if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                    this.connect();
                }
            }, reconnectIntervalDelay);
        });
    }

    /**
     * Establish WebSocket connection with stored configuration. Will close any previous connection
     */
    connect() {
        logger.info("connection requested");

        this.close();

        let handleConnectionError = err => {
            logger.error(err);
            this.wsReady.reject(err);
            this.wsSubject.next(null);

            if (typeof this.serverErrorHandler === 'function') {
                this.serverErrorHandler.call(this, err);
            }
        };

        let ws;

        try {
            ws = new WebSocketClient('ws://' + this.serverUrl);
            ws.onopen = () => {
                logger.debug("connection established");
                this.wsReady.resolve(ws);
                this.wsSubject.next(ws);
            };

            ws.onclose = err => handleConnectionError(err);
        } catch (err) {
            handleConnectionError(err)
        } finally {
            this.ws = ws;
        }
    }

    /**
     * Close connection, is any
     */
    close() {
        if (this.ws) {
            logger.debug("closing existing connection");
            this.ws.close();
            this.wsReady = new defer();
            this.wsSubject.next(null);
        }
    }

    /**
     * Set the WebSocket server url
     * @param {string} url
     */
    setServerUrl(url) {
        this.serverUrl = url;
    }

    /**
     * Set the WebSocket error handler
     * @param {function} errorCallback
     */
    setServerConnectionErrorHandler(errorCallback) {
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

        logger.debug("sending command :");
        logger.debug(data);

        this.getWebSocketReady().then(function (ws) {
            ws.send(JSON.stringify(data));
            logger.debug("command sent");
        }).catch(err => {
            logger.error("cannot send command `" + cmd + "`, socket is in error : " + err.code);
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

        logger.debug("sending event :");
        logger.debug(data);

        this.getWebSocketReady().then(function (ws) {
            ws.send(JSON.stringify(data));
            logger.debug("event sent");
        }).catch(err => {
            logger.error("cannot send event `" + event + "`, socket is in error : " + err.code);
        });
    }
}