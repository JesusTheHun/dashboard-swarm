import {DEBUG_LEVEL} from "./env";
import Logger from "js-logger/src/logger";

let enforceDigits = (number, digits) => {
    let str = number.toString();

    while (str.length < digits) {
        str = '0' + str;
    }

    return str;
};

let handler = Logger.createDefaultHandler({
    formatter: (messages, context) => {

        let date = new Date;
        let time = '[ ' + enforceDigits(date.getHours(), 2) +':'+ enforceDigits(date.getMinutes(), 2) +':'+ enforceDigits(date.getSeconds(), 2) +'.'+ enforceDigits(date.getMilliseconds(), 3) + ' ]';

        if (context.name) {
            messages.unshift('[ ' + context.name + ' ]');
        }

        messages.unshift('[ ' + context.level.name + ' ]');
        messages.unshift(time);
    }
});

Logger.setLevel(DEBUG_LEVEL);
Logger.setHandler(handler);

Logger.info("Logger loaded, log level : " + DEBUG_LEVEL.name);

export default Logger;