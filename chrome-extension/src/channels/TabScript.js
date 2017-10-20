import ContentScript from '../contentScript';
import ExtendableProxy from '../channels/ExtendableProxy';

class TabScript extends ExtendableProxy {
    constructor(id) {
        super({
            get: (target, prop) => {
                if (typeof ContentScript.prototype[prop] === 'function') {
                    return (...args) => {
                        if (this[prop] === 'function') {
                            return tab[prop].apply(this, args);
                        }
                        return chrome.tabs.sendMessage(id, {action: prop, args: args});
                    };
                }

                return target[prop];
            }
        });

        this.id = id;
    }
}

export default TabScript;