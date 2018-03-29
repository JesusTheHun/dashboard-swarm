/*global chrome*/

import Logger from "../logger";
import nodeProxy from "../channels/NodeProxy";
import {ApiEvent} from "../actions/events";
import {ApiCommandType} from "../actions/commands";

const NodeProxy = new nodeProxy();

export const backgroundBridge = store => {

    let middleware = new BackgroundBridgeMiddleware(store);
    middleware.init();

    return next => action => {
        middleware.handleApiCall(action);

        let previousConfig = store.getState().configClient;
        next(action);
        let latestConfig = store.getState().configClient;

        middleware.handleConfigChanges(previousConfig, latestConfig);
    };
};

class BackgroundBridgeMiddleware {
    constructor(store) {
        this.store = store;
        this.logger = Logger.get('MiddlewareBackgroundBridge');
    }

    init() {
        this.listenApiEvents();

        NodeProxy.isConnected(isConnected => {
            this.store.dispatch(ApiEvent.CONNECTED(isConnected));

            if (isConnected) {
                NodeProxy.getDisplays();
                NodeProxy.getTabs();
                NodeProxy.getRotationStatus();
                NodeProxy.getConfig();
            }
        });
    }

    handleApiCall(action) {
        if (action.type === ApiCommandType.START_ROTATION) NodeProxy.startRotation();
        if (action.type === ApiCommandType.STOP_ROTATION) NodeProxy.stopRotation();
        if (action.type === ApiCommandType.MASTER) NodeProxy.setMaster(action.master);
        if (action.type === ApiCommandType.SERVER_URL) NodeProxy.setServerUrl(action.serverUrl);
        if (action.type === ApiCommandType.CONNECT) NodeProxy.connect();
        if (action.type === ApiCommandType.DISCONNECT) NodeProxy.close();
    }

    handleConfigChanges(previousConfig, latestConfig) {
        if (previousConfig !== latestConfig && chrome && chrome.storage) {
            chrome.storage.sync.set(latestConfig, () => this.logger.debug("config saved", latestConfig));
        }

        if (previousConfig.master !== latestConfig.master) {
            NodeProxy.setMaster(latestConfig.master);
        }

        if (previousConfig.serverUrl !== latestConfig.serverUrl) {
            this.logger.info("server url changed to ` " + latestConfig.serverUrl + "`, reconnection...");
            NodeProxy.setServerUrl(latestConfig.serverUrl);
            NodeProxy.connect();
        }
    }

    listenApiEvents() {
        NodeProxy.on('connectionSuccess', () => {
            this.resetState();
            this.store.dispatch(ApiEvent.CONNECTED(true));
            NodeProxy.getConfig();
        });

        NodeProxy.on('connectionFailed', () => {
            this.resetState();
            this.store.dispatch(ApiEvent.CONNECTED(false));
        });

        NodeProxy.on('connectionAttempt', () => {
            this.logger.debug('connectionAttempt');
            this.store.dispatch(ApiEvent.WAITING_CONNECTION(true));
        });

        NodeProxy.on('serverConfig', config => {
            this.store.dispatch(ApiEvent.SERVER_CONFIG(config));
        });

        NodeProxy.on('getDisplays', displays => {
            this.logger.debug("getDisplays", displays);
            this.store.dispatch(ApiEvent.WAITING_MASTER(displays.length === 0));
            this.store.dispatch(ApiEvent.DISPLAYS(displays));
        });

        NodeProxy.on('getTabs', tabs => {
            this.logger.debug("getTabs", tabs);
            this.store.dispatch(ApiEvent.TABS_SET(tabs));
        });

        NodeProxy.on('tabOpened', tab => {
            this.store.dispatch(ApiEvent.TAB_ADDED(tab));
        });

        NodeProxy.on('tabClosed', id => {
            this.store.dispatch(ApiEvent.TAB_REMOVED(id));
        });

        NodeProxy.on('tabUpdated', ([id, props]) => {
            this.store.dispatch(ApiEvent.TAB_UPDATED(id, props));
        });

        NodeProxy.on('rotationStatus', playing => {
            this.store.dispatch(ApiEvent.ROTATION_PLAYING(playing));
        });

        NodeProxy.on('rotationStarted', () => {
            this.store.dispatch(ApiEvent.ROTATION_PLAYING(true));
        });

        NodeProxy.on('rotationStopped', () => {
            this.store.dispatch(ApiEvent.ROTATION_PLAYING(false));
        });
    }

    resetState() {
        this.store.dispatch(ApiEvent.WAITING_MASTER(true));
        this.store.dispatch(ApiEvent.DISPLAYS([]));
        this.store.dispatch(ApiEvent.TABS_SET([]));
        this.store.dispatch(ApiEvent.ACTIVE_DISPLAY(0));
        this.store.dispatch(ApiEvent.WAITING_CONNECTION(false));
    }
}