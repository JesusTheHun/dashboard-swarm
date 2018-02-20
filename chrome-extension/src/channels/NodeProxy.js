import { DashboardSwarmNode } from '../classes/DashboardSwarmNode';
import { ExtendableProxy } from '../../../common/ExtendableProxy';
import Logger from "js-logger/src/logger";

const logger = Logger.get('NodeProxy');

class NodeProxy extends ExtendableProxy {
    constructor() {
        super({
            get: (target, prop) => {
                let targetFunction = DashboardSwarmNode.prototype[prop];

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

        chrome.runtime.onMessage.addListener(data => {
            if (data.target !== 'popup') return;

            logger.debug("Event: ", data);

            let subscriptions = this.subscriptions[data.action];

            if (subscriptions instanceof Array && subscriptions.length > 0) {
                subscriptions.forEach(subscription => {
                    subscription.apply(data, [data.data]);
                });
            }
        });
    }

    on(event, callback) {
        let events = this.subscriptions[event] || [];
        events.push(callback);
        this.subscriptions[event] = events;
    }
}

export default NodeProxy;