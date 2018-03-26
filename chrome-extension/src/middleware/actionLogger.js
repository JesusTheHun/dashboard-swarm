/*global chrome*/

import Logger from "../logger";

const logger = Logger.get('MiddlewareLogger');

export const actionLogger = store => next => action => {
    logger.debug(action.type, action);
    return next(action);
};