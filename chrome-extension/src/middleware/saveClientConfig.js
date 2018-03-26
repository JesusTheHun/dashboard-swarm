/*global chrome*/

import Logger from "../logger";

const logger = Logger.get('MiddlewareSaveClientConfig');

export const saveClientConfig = store => next => action => {
    let previousConfig = store.getState().configClient;
    next(action);
    let latestConfig = store.getState().configClient;

    if (previousConfig !== latestConfig && chrome && chrome.storage) {
        chrome.storage.sync.set(latestConfig, () => logger.debug("config saved", latestConfig));
    }
};