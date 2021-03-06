/*global chrome*/

import { ContentScript } from '../contentScript';
import { ExtendableProxy } from './ExtendableProxy';

class TabProxy extends ExtendableProxy {

    constructor(id) {
        super({
            get: (target, prop) => {
                let targetFunction = ContentScript.prototype[prop];

                if (typeof targetFunction === 'function') {
                    return (...args) => {
                        if (this[prop] === 'function') {
                            return this[prop].apply(this, args);
                        }

                        let responseCallback = undefined;

                        if (args.length > targetFunction.length) {
                            responseCallback = args.pop();
                        }

                        chrome.tabs.sendMessage(id, {action: prop, args: args}, {}, responseCallback);
                    };
                }

                return target[prop];
            }
        });

        this.id = id;
    }
}
export default TabProxy;