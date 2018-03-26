/*global chrome*/

import Logger from "../logger";
import nodeProxy from "../channels/NodeProxy";

const logger = Logger.get('MiddlewareBackgroundBridge');

export const backgroundBridge = store => {

    const NodeProxy = new nodeProxy();

    NodeProxy.on('connectionSuccess', () => {
        reset();
        store.dispatch({
            type: 'SET_CONNECTED',
            connected: true
        });

        NodeProxy.getConfig();
    });

    NodeProxy.on('connectionFailed', () => {
        reset();
        store.dispatch({
            type: 'SET_CONNECTED',
            connected: false
        });
    });

    function reset() {
        store.dispatch({
            type: 'SET_WAITING_MASTER',
            waiting: true
        });

        store.dispatch({
            type: 'SET_DISPLAYS',
            displays: []
        });

        store.dispatch({
            type: 'SET_TABS',
            tabs: []
        });

        store.dispatch({
            type: 'SET_ACTIVE_DISPLAY',
            activeDisplay: 0
        });

        store.dispatch({
            type: 'SET_WAITING_CONNECTION',
            connecting: false
        });
    }

    NodeProxy.on('connectionAttempt', () => {
        logger.debug('connectionAttempt');
        store.dispatch({
            type: 'SET_WAITING_CONNECTION',
            connecting: true
        });
    });

    NodeProxy.on('serverConfig', parameters => {
        store.dispatch({
            type: 'SET_SERVER_PARAMETERS',
            parameters
        });
    });

    NodeProxy.on('getDisplays', displays => {
        logger.debug("getDisplays", displays);
        store.dispatch({
            type: 'SET_WAITING_MASTER',
            waiting: displays.length === 0
        });

        store.dispatch({
            type: 'SET_DISPLAYS',
            displays
        });
    });

    NodeProxy.on('getTabs', tabs => {
        logger.debug("getTabs", tabs);
        store.dispatch({
            type: 'SET_TABS',
            tabs
        });
    });

    NodeProxy.on('tabOpened', tab => {
        store.dispatch({
            type: 'ADD_TAB',
            tab
        });
    });

    NodeProxy.on('tabClosed', id => {
        store.dispatch({
            type: 'REMOVE_TAB',
            id
        });
    });

    NodeProxy.on('tabUpdated', ([id, props]) => {
        store.dispatch({
            type: 'UPDATE_TAB',
            id,
            props
        });
    });

    NodeProxy.on('rotationStatus', status => {
        store.dispatch({
            type: 'SET_ROTATION_PLAYING',
            playing: status
        });
    });

    NodeProxy.on('rotationStarted', () => {
        store.dispatch({
            type: 'SET_ROTATION_PLAYING',
            playing: true
        });
    });

    NodeProxy.on('rotationStopped', () => {
        store.dispatch({
            type: 'SET_ROTATION_PLAYING',
            playing: false
        });
    });

    NodeProxy.isConnected(isConnected => {
        store.dispatch({
            type: 'SET_CONNECTED',
            connected: isConnected
        });

        if (isConnected) {
            NodeProxy.getDisplays();
            NodeProxy.getTabs();
            NodeProxy.getRotationStatus();
            NodeProxy.getConfig();
        }
    });

    return next => action => {
        let previousConfig = store.getState().configClient;
        next(action);
        let latestConfig = store.getState().configClient;

        if (previousConfig.master !== latestConfig.master) {
            NodeProxy.setMaster(latestConfig.master);
        }

        if (previousConfig.serverUrl !== latestConfig.serverUrl) {
            logger.info("server url changed to ` " + latestConfig.serverUrl + "`, reconnection...");
            NodeProxy.setServerUrl(latestConfig.serverUrl);
            NodeProxy.connect();
        }
    };
};

