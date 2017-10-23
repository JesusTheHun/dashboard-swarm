import DashboardSwarmNode from '../classes/DashboardSwarmNode';
import ExtendableProxy from '../channels/ExtendableProxy';

class NodeProxy extends ExtendableProxy {
    constructor() {
        super({
            get: (target, prop) => {
                let targetFunction = Object.getPrototypeOf(DashboardSwarmNode)[prop];

                if (typeof targetFunction === 'function') {
                    return (...args) => {
                        if (this[prop] === 'function') {
                            return this[prop].apply(this, args);
                        }

                        let responseCallback = undefined;

                        if (args.length > targetFunction.length) {
                            responseCallback = args.pop();
                        }

                        return chrome.runtime.sendMessage({node: prop, args: args}, responseCallback);
                    };
                }

                return target[prop];
            }
        });

        this.subscriptions = {};

        let nodeProxy = this;

        chrome.runtime.onMessage.addListener(function(data) {
            if (data.target !== 'popup') return;

            let subscriptions = nodeProxy.subscriptions[data.action];

            if (subscriptions instanceof Array && subscriptions.length > 0) {
                subscriptions.forEach(subscription => {
                    let args = data.data instanceof Array ? data.data : [data.data];
                    subscription.apply(data, args);
                });
            }
        });
    }

    on(event, callback) {
        let events = this.subscriptions[event];
        if (events === undefined) {
            events = [];
        }

        events.push(callback);
        this.subscriptions[event] = events;
    }
}

export default NodeProxy;