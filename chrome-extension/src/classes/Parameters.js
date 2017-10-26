import DashboardSwarmListener from "./DashboardSwarmListener";
import DashboardSwarmWebSocket from "./DashboardSwarmWebSocket";
import Rx from "rxjs";

const paramsName = [
    'tabSwitchInterval',
    'flashTabLifetime',
    'flashTabSwitchInterval',
];

class Parameters {
    constructor() {
        if (!Parameters.instance) {
            this.params = {};

            paramsName.forEach(paramName => {
                this.params[paramName] = new Rx.BehaviorSubject(undefined);
            });

            DashboardSwarmListener.subscribeEvent('serverConfig', config => {
                paramsName.forEach(paramName => {
                    let upToDateValue = config[paramName];
                    let currentValue = this.getParameter(paramName);

                    if (currentValue !== upToDateValue) {
                        this.params[paramName].next(config[paramName]);
                    }
                });
            });

            DashboardSwarmWebSocket.sendCommand('getConfig');

            Parameters.instance = this;
        }

        return Parameters.instance;
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

const instance = new Parameters();
Object.freeze(instance.instance);

export default instance;