import DashboardSwarmListener from "./DashboardSwarmListener";
import Rx from "rxjs";

let paramsName = [
    'tabSwitchInterval',
    'flashTabLifetime',
    'flashTabSwitchInterval',
];

let params = {};

class Parameters {
    constructor() {
        if (!Parameters.instance) {

            paramsName.forEach(paramName => {
                params[paramName] = new Rx.BehaviorSubject([undefined]);
            });

            DashboardSwarmListener.subscribeEvent('serverConfig', config => {
                paramsName.forEach(paramName => {
                    let upToDateValue = config[paramsName];
                    let currentValue = params[paramName];

                    if (currentValue !== upToDateValue) {
                        params[paramName].next(config[paramsName]);
                    }
                });
            });

            Parameters.instance = this;
        }

        return Parameters.instance;
    }

    getParameters() {
        let p = {};

        paramsName.forEach(paramName => {
           p[paramName] = params[paramName].getValue();
        });
    }

    getParametersName() {
        return paramsName;
    }

    getParameter(paramName) {
        return params[paramName].getValue();
    }

    subscribe(paramName, callback) {
        params[paramName].subscribe(callback);

        return this;
    }
}

const instance = new Parameters();
Object.freeze(instance.instance);

export default instance;