/*global chrome*/

import Logger from "js-logger/src/logger";

const logger = Logger.get('DashboardSwarmNodeMaster');

export class DashboardSwarmNodeMaster {
    constructor(node, listener, wm) {
        this.node = node;
        this.listener = listener;
        this.wm = wm;
        this.subscriptions = {};
        this.tabAutorefreshIntervals = {};
    }

    on() {
        this.subscribe();
        this.node.getTabs();
        this.node.getDisplays();
        this.node.getRotationStatus();
        this.crashedTabCheckInterval = setInterval(() => this.reloadCrashedTabs(), 10000);
        this.updateTabAutorefreshConfigInterval = setInterval(() => this.updateTabAutorefreshConfig(), 10000);
        this.tabAutorefreshIntervals = {};
    }

    off() {
        this.unsubscribe();
        this.wm.closeEverything();
        this.listener.getDashboardSwarmWebSocket().sendEvent('masterDisplays', [[]]);
        this.tabs = [];

        clearInterval(this.crashedTabCheckInterval);
        clearInterval(this.updateTabAutorefreshConfigInterval);

        Object.keys(this.tabAutorefreshIntervals).forEach(intervalConfig => {
            clearInterval(intervalConfig.interval);
        })
    }

    subscribe() {
        let key = 0;
        let subscriptions = {};

        subscriptions['serverTabs'] = this.listener.subscribeEvent('serverTabs', tabs => {
            // Maybe it has been unsubscribed before we reach the callback
            if (subscriptions['serverTabs']) {
                this.tabs = tabs;
                this.wm.setTabs(tabs);

                // Unsubscribe
                subscriptions['serverTabs']();
                delete subscriptions['serverTabs'];
            }
        });

        subscriptions[key++] = this.listener.subscribeCommand('openTab', (display, url, isFlash) => {
            this.wm.openTab(display, url).then(tabId => {
                let scroll = {top: 0, left: 0};
                let flash = isFlash ? new Date() : undefined;
                let tab = this.wm.getTab(tabId);
                tab.flash = flash;

                chrome.tabs.getZoom(tabId, zoom => {
                    this.listener.getDashboardSwarmWebSocket().sendEvent('tabOpened', [tabId, display, url, 'Loading...', tab.index, flash, zoom, scroll]);
                });
            });
        });

        subscriptions[key++] = this.listener.subscribeCommand('closeTab', tabId => {
            if (this.wm.getTab(tabId) !== undefined) {
                this.wm.closeTab(tabId).then(tabId => {
                    this.listener.getDashboardSwarmWebSocket().sendEvent('tabClosed', [tabId]);
                });
            }
        });

        subscriptions[key++] = this.listener.subscribeCommand('updateTab', (tabId, newProps) => {
            if (this.wm.getTab(tabId) !== undefined) {

                if (newProps.autorefresh !== undefined) {
                    this.listener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tabId, {autorefresh: newProps.autorefresh}]);
                }

                if (newProps.position !== undefined) {
                    this.wm.setTabPosition(tabId, newProps.position);
                }

                if (newProps.url !== undefined) {
                    this.wm.setTabUrl(tabId, newProps.url);
                }

                if (newProps.display !== undefined) {
                    this.wm.setTabDisplay(tabId, newProps.display);
                }

                if (newProps.zoom !== undefined) {
                    this.wm.setTabZoom(tabId, newProps.zoom);
                }

                if (newProps.scroll !== undefined) {
                    this.wm.setTabScroll(tabId, newProps.scroll);
                }
            }
        });

        subscriptions[key++] = this.listener.subscribeCommand('getDisplays', () => {
            logger.debug("displays request received");
            this.wm.getDisplays().then(displays => {
                this.listener.getDashboardSwarmWebSocket().sendEvent('masterDisplays', [displays]);
            });
        });

        subscriptions[key++] = this.listener.subscribeCommand('startRotation', (interval, intervalFlash) => {
            this.wm.startRotation(interval, intervalFlash);
        });

        subscriptions[key++] = this.listener.subscribeCommand('stopRotation', () => {
            this.wm.stopRotation();
        });

        subscriptions[key++] = this.listener.subscribeCommand('getRotationStatus', () => {
            this.listener.getDashboardSwarmWebSocket().sendEvent('rotationStatus', [this.wm.isRotationActive()]);
        });

        subscriptions[key++] = this.listener.subscribeCommand('reloadTab', tabId => {
            chrome.tabs.reload(tabId);
        });

        subscriptions[key++] = this.listener.subscribeCommand('sendToForeground', tabId => {
            chrome.tabs.update(tabId, {active: true});
        });

        subscriptions[key++] = this.listener.subscribeCommand('restartMaster', () => {
            this.wm.closeEverything().then(windowClosedCount => {
                setTimeout(() => chrome.runtime.reload(), 2000);
            });
        });

        subscriptions[key++] = this.listener.subscribeEvent('tabOpened', (id, display, url, title, position, flash, zoom, scroll) => {
            this.tabs.push({id, display, url, title, position, flash, zoom, scroll});
        });

        subscriptions[key++] = this.listener.subscribeEvent('tabClosed', (tabId) => {
            let index = this.tabs.findIndex(tab => tab.id === tabId);
            this.tabs.splice(index, 1);
        });

        subscriptions[key++] = this.listener.subscribeEvent('tabUpdated', (tabId, newProps) => {
            let tab = this.tabs.find(tab => tab.id === tabId);
            Object.assign(tab, newProps);

            if (newProps.id !== undefined) {
                this.tabAutorefreshIntervals[newProps.id] = this.tabAutorefreshIntervals[tabId];
                delete this.tabAutorefreshIntervals[tabId];
            }
        });

        this.tabTitleListener = (changedTabId, changeInfo, tab) => {
            if (this.wm.getTab(changedTabId) !== undefined && changeInfo.title !== undefined && changeInfo.title !== '') {
                this.listener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [changedTabId, {title: changeInfo.title}]);
            }
        };

        chrome.tabs.onUpdated.addListener(this.tabTitleListener);

        this.subscriptions = subscriptions;
    }

    unsubscribe() {
        Object.keys(this.subscriptions).forEach(key => this.subscriptions[key]());
        chrome.tabs.onUpdated.removeListener(this.tabTitleListener);
    }

    reloadCrashedTabs() {
        Object.keys(this.wm.getTabs()).forEach(tabId => {
            chrome.tabs.sendMessage(parseInt(tabId), 'areYouAlive?', {}, function() {
                // If tab has crashed
                if (chrome.runtime.lastError) {
                    chrome.tabs.reload(parseInt(tabId), {}, () => logger.info("Crashed tab reloaded"));
                }
            });
        });
    }

    updateTabAutorefreshConfig() {
        logger.debug("update autorefresh config...", this.tabs);

        this.tabs.forEach(tab => {
            let intervalConfig = this.tabAutorefreshIntervals[tab.id];

            if (intervalConfig) {
                logger.debug(tab.id, "autorefresh already active");

                if (intervalConfig.autorefresh === tab.autorefresh) {
                    logger.debug(tab.id, "current config is ok, exit");
                    return;
                }

                logger.debug(tab.id, "clear current config");
                clearInterval(this.tabAutorefreshIntervals[tab.id].interval);
                delete this.tabAutorefreshIntervals[tab.id];
            }

            if (tab.autorefresh > 0) {
                logger.debug(tab.id, "new autorefresh detected", tab.autorefresh);

                this.tabAutorefreshIntervals[tab.id] = {};
                this.tabAutorefreshIntervals[tab.id].autorefresh = tab.autorefresh;
                this.tabAutorefreshIntervals[tab.id].interval = setInterval(() => {
                    chrome.tabs.reload(parseInt(tab.id), {}, () => logger.info("Tab autorefreshed"));
                }, tab.autorefresh * 1000)
            }
        });
    }
}