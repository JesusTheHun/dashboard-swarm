/*global chrome*/

import Logger from "../logger";
import nodeProxy from "../channels/NodeProxy";
import {ApiEvent} from "../actions/events";
import {ApiCommandType} from "../actions/commands";
import {LocalAction} from "../actions/local";

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
        if (action.type === ApiCommandType.DISCONNECT) NodeProxy.disconnect();
        if (action.type === ApiCommandType.OPEN_TAB) NodeProxy.openTab(action.display, action.url, action.isFlash);
        if (action.type === ApiCommandType.CLOSE_TAB) NodeProxy.closeTab(action.id);
        if (action.type === ApiCommandType.SEND_TAB_TO_FOREGROUND) NodeProxy.sendToForeground(action.id);
        if (action.type === ApiCommandType.RELOAD_TAB) NodeProxy.reloadTab(action.id);
        if (action.type === ApiCommandType.SEND_TAB_TO_DISPLAY) NodeProxy.updateTab(action.id, {display: parseInt(action.display)});
        if (action.type === ApiCommandType.ZOOM_TAB) NodeProxy.updateTab(action.id, {zoom: action.zoom});
        if (action.type === ApiCommandType.SCROLL_TAB) NodeProxy.updateTab(action.id, {scroll: action.scroll});
        if (action.type === ApiCommandType.MOVE_TAB) NodeProxy.updateTab(action.id, {position: action.position});
        if (action.type === ApiCommandType.SET_TAB_TITLE) NodeProxy.updateTab(action.id, {title: action.title});
        if (action.type === ApiCommandType.SET_TAB_URL) NodeProxy.updateTab(action.id, {url: action.url});
        if (action.type === ApiCommandType.SET_TAB_AUTOREFRESH) NodeProxy.updateTab(action.id, {autorefresh: action.autorefresh});
        if (action.type === ApiCommandType.SERVER_CONFIG) NodeProxy.setConfig(action.serverConfig);
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
        this.store.dispatch(ApiEvent.WAITING_CONNECTION(false));
        this.store.dispatch(LocalAction.ACTIVE_DISPLAY(0));
    }
}