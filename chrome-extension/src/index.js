/*global chrome*/

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import '../node_modules/spectre.css/dist/spectre-icons.min.css';
import '../node_modules/spectre.css/dist/spectre.min.css';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import './popup.css';

import logger from "./logger";
import defer from "./defer";
import reducers from "./reducers";
import {applyMiddleware, createStore} from "redux";
import {actionLogger} from "./middleware/actionLogger";
import {backgroundBridge} from "./middleware/backgroundBridge";
import {browserData} from "./middleware/browserData";

let initialStateLoaded = new defer();

if (chrome.storage) {
    chrome.storage.sync.get({
        master: false,
        serverUrl: 'localhost:8080'
    }, storedTree => {
        initialStateLoaded.resolve({
            configClient: storedTree
        });
    });
} else {
    initialStateLoaded.resolve({});
}

let middlewares = [actionLogger, backgroundBridge, browserData];

initialStateLoaded.then(stateTree => {

    logger.info("tree loaded", stateTree);

    let enhancer;

    if (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
        enhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(
            applyMiddleware(...middlewares)
        );
    } else {
        enhancer = applyMiddleware(...middlewares);
    }

    let store = createStore(reducers, stateTree, enhancer);

    ReactDOM.render(<App store={store}/>, document.getElementById('root'));
    registerServiceWorker();
});