import DashboardSwarmWebSocket from './DashboardSwarmWebSocket';

class DashboardSwarmListener {

    constructor() {
        if (!DashboardSwarmListener.instance) {

            let listener = this;
            listener.handlers = {'event': [], 'command': []};

            DashboardSwarmWebSocket.getWebSocketReady().then(function (ws) {
                ws.on('data', function (message) {
                    try {
                        let data = JSON.parse(message);
                        listener.dispatch(data);

                    } catch (err) {
                        console.log(err);
                    }
                })
            });

            DashboardSwarmListener.instance = this;
        }
        return DashboardSwarmListener.instance;
    }


    subscribeEvent(eventName, callback) {
        return subscribe.call(this, 'event', eventName, callback);
    }

    unsubscribeEvent(eventName, callback) {
        return unsubscribe.call(this, 'event', eventName, callback);
    }

    subscribeCommand(commandName, callback) {
        return subscribe.call(this, 'command', commandName, callback);
    }

    unsubscribeCommand(commandName, callback) {
        return unsubscribe.call(this, 'command', commandName, callback);
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

function subscribe(namespace, name, callback) {
    if (this.handlers[namespace][name] === undefined) {
        this.handlers[namespace][name] = [];
    }

    this.handlers[namespace][name].push(callback);
    return true;
}

function unsubscribe(namespace, name, callback) {
    if (this.handlers[namespace][name] === undefined) {
        return false;
    }

    let foundCallback = this.handlers[namespace][name].find(cb => cb === callback);

    if (foundCallback !== undefined) {
        this.handlers[namespace][name].splice(foundCallback, 1);
    }

    return foundCallback !== undefined;
}

const instance = new DashboardSwarmListener();
Object.freeze(instance.instance);

export default instance;