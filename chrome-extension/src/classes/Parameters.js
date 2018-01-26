import Rx from "rxjs";

const paramsName = [
    'tabSwitchInterval',
    'flashTabLifetime',
    'flashTabSwitchInterval',
];

export class Parameters {
    constructor(listener) {
        this.ws = listener.getWebSocket();
        this.dsListener = listener;

        this.params = {};

        paramsName.forEach(paramName => {
            this.params[paramName] = new Rx.BehaviorSubject(undefined);
        });

        listener.subscribeEvent('serverConfig', config => {
            paramsName.forEach(paramName => {
                let upToDateValue = config[paramName];
                let currentValue = this.getParameter(paramName);

                if (currentValue !== upToDateValue) {
                    this.params[paramName].next(config[paramName]);
                }
            });
        });

        this.ws.sendCommand('getConfig');
    }

    getParameters() {
        let p = {};

        paramsName.forEach(paramName => {
           p[paramName] = this.params[paramName].getValue();
        });

        return p;
    }

    getParametersName() {
        return paramsName;
    }

    getParameter(paramName) {
        return this.params[paramName].getValue();
    }

    subscribe(paramName, callback) {
        this.params[paramName].subscribe(callback);
        return this;
    }
}