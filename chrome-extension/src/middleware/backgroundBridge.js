/*global chrome*/

import Logger from "../logger";
import nodeProxy from "../channels/NodeProxy";

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
            this.store.dispatch({
                type: 'CONNECTED',
                connected: isConnected
            });

            if (isConnected) {
                NodeProxy.getDisplays();
                NodeProxy.getTabs();
                NodeProxy.getRotationStatus();
                NodeProxy.getConfig();
            }
        });
    }

    handleApiCall(action) {
        if (action.type === 'ROTATION_START') NodeProxy.startRotation();
        if (action.type === 'ROTATION_STOP') NodeProxy.stopRotation();
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
            this.store.dispatch({
                type: 'CONNECTED',
                connected: true
            });

            NodeProxy.getConfig();
        });

        NodeProxy.on('connectionFailed', () => {
            this.resetState();
            this.store.dispatch({
                type: 'CONNECTED',
                connected: false
            });
        });

        NodeProxy.on('connectionAttempt', () => {
            this.logger.debug('connectionAttempt');
            this.store.dispatch({
                type: 'WAITING_CONNECTION',
                connecting: true
            });
        });

        NodeProxy.on('serverConfig', parameters => {
            this.store.dispatch({
                type: 'SERVER_PARAMETERS',
                parameters
            });
        });

        NodeProxy.on('getDisplays', displays => {
            this.logger.debug("getDisplays", displays);
            this.store.dispatch({
                type: 'WAITING_MASTER',
                waiting: displays.length === 0
            });

            this.store.dispatch({
                type: 'DISPLAYS',
                displays
            });
        });

        NodeProxy.on('getTabs', tabs => {
            this.logger.debug("getTabs", tabs);
            this.store.dispatch({
                type: 'TABS_SET',
                tabs
            });
        });

        NodeProxy.on('tabOpened', tab => {
            this.store.dispatch({
                type: 'TAB_ADDED',
                tab
            });
        });

        NodeProxy.on('tabClosed', id => {
            this.store.dispatch({
                type: 'TAB_REMOVED',
                id
            });
        });

        NodeProxy.on('tabUpdated', ([id, props]) => {
            this.store.dispatch({
                type: 'TAB_UPDATED',
                id,
                props
            });
        });

        NodeProxy.on('rotationStatus', status => {
            this.store.dispatch({
                type: 'ROTATION_PLAYING',
                playing: status
            });
        });

        NodeProxy.on('rotationStarted', () => {
            this.store.dispatch({
                type: 'ROTATION_PLAYING',
                playing: true
            });
        });

        NodeProxy.on('rotationStopped', () => {
            this.store.dispatch({
                type: 'ROTATION_PLAYING',
                playing: false
            });
        });
    }

    resetState() {
        this.store.dispatch({
            type: 'WAITING_MASTER',
            waiting: true
        });

        this.store.dispatch({
            type: 'DISPLAYS',
            displays: []
        });

        this.store.dispatch({
            type: 'TABS_SET',
            tabs: []
        });

        this.store.dispatch({
            type: 'ACTIVE_DISPLAY',
            activeDisplay: 0
        });

        this.store.dispatch({
            type: 'WAITING_CONNECTION',
            connecting: false
        });
    }
}