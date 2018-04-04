import Logger from "js-logger/src/logger";

const logger = Logger.get('DashboardSwarmListener');

export class DashboardSwarmListener {

    constructor(dsws) {
        this.dsws = dsws;
        this.handlers = {'event': [], 'command': []};

        dsws.getWebSocketSubject().subscribe(ws => {
            if (ws === null) return;
            ws.onmessage = event => {
                let message = event.data;

                try {
                    let data = JSON.parse(message);
                    this.dispatch(data);

                } catch (err) {
                    console.log(err);
                }
            }
        });
    }

    getDashboardSwarmWebSocket() {
        return this.dsws;
    }

    subscribeEvent(eventName, callback) {
        return subscribe.call(this, 'event', eventName, callback);
    }

    subscribeCommand(commandName, callback) {
        return subscribe.call(this, 'command', commandName, callback);
    }

    dispatch(data) {
        let namespace;
        let name;

        switch (true) {
            case data.hasOwnProperty('cmd'):
                namespace = 'command';
                name = data.cmd;
            break;

            case data.hasOwnProperty('event'):
                namespace = 'event';
                name = data.event;
            break;
        }

        if (namespace !== undefined && this.handlers[namespace][name] !== undefined) {
            this.handlers[namespace][name].forEach(function (callback) {
                callback.apply(undefined, data.args);
            });
        }
    }
}

/**
 * Return unsubscribe method
 * @param namespace
 * @param name
 * @param callback
 * @returns {function} Unsubscribe function
 */
function subscribe(namespace, name, callback) {
    if (this.handlers[namespace][name] === undefined) {
        this.handlers[namespace][name] = [];
    }

    this.handlers[namespace][name].push(callback);

    return () => {
        this.handlers[namespace][name] = this.handlers[namespace][name].filter(cb => cb !== callback);
    }
}