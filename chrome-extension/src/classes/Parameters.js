import Rx from "rxjs";

const paramsName = [
    'tabSwitchInterval',
    'flashTabLifetime',
    'flashTabSwitchInterval',
];

export class Parameters {
    constructor(listener) {
        this.dsws = listener.getDashboardSwarmWebSocket();
        this.listener = listener;

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

        this.dsws.sendCommand('getConfig');
    }

    getParameters() {
        let p = {};

        paramsName.forEach(paramName => {
           p[paramName] = this.params[paramName].getValue();
        });

        return p;
    }

    static getParametersName() {
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