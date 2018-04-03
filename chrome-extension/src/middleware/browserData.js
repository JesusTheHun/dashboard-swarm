/*global chrome*/

import {BrowserAction} from "../actions/browser";

export const browserData = store => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        let tab = tabs[0];

        if (tab !== undefined && tab.url !== undefined) {
            store.dispatch(BrowserAction.ACTIVE_TAB(tab));
        }
    });

    return next => action => {
        next(action);
    };
};