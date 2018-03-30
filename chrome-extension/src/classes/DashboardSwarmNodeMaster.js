/*global chrome*/

import Logger from "js-logger/src/logger";

const logger = Logger.get('DashboardSwarmNodeMaster');

export class DashboardSwarmNodeMaster {
    constructor(node, listener, wm) {
        this.node = node;
        this.listener = listener;
        this.wm = wm;
        this.subscriptions = {};
    }
    
    on() {
        this.subscribe();
        this.node.getTabs();
        this.node.getDisplays();
        this.node.getRotationStatus();
    }

    off() {
        this.unsubscribe();
        this.wm.closeEverything();
        this.listener.getDashboardSwarmWebSocket().sendEvent('masterDisplays', [[]]);
    }

    subscribe() {
        let key = 0;
        let subscriptions = {};

        subscriptions['serverTabs'] = this.listener.subscribeEvent('serverTabs', tabs => {
            // Maybe it has been unsubscribe before we reach the callback
            if (subscriptions['serverTabs']) {
                this.wm.setTabs(tabs);

                // Unsubscribe
                subscriptions['serverTabs']();
                delete subscriptions['serverTabs'];
            }
        });

        subscriptions[key++] = this.listener.subscribeCommand('openTab', (display, url, isFlash) => {
            this.wm.openTab(display, url).then(tabId => {
                let updateWhenTitleIsReady = (changedTabId, changeInfo, tab) => {
                    if (changedTabId === tabId && changeInfo.title !== undefined && changeInfo.title !== '') {
                        let scroll = {top: 0, left: 0};

                        chrome.tabs.getZoom(tabId, zoom => {
                            let flash = isFlash ? new Date() : undefined;
                            this.wm.getTab(tabId).flash = flash;
                            this.listener.getDashboardSwarmWebSocket().sendEvent('tabOpened', [tabId, display, url, changeInfo.title, tab.index, flash, zoom, scroll]);
                        });
                        chrome.tabs.onUpdated.removeListener(updateWhenTitleIsReady);
                    }
                };

                chrome.tabs.onUpdated.addListener(updateWhenTitleIsReady);
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
                if (newProps.position !== undefined) {
                    this.wm.setTabPosition(tabId, newProps.position);
                }

                if (newProps.url !== undefined) {
                    this.wm.setTabUrl(tabId, newProps.url, newProps.title);
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
                chrome.runtime.reload();
            });
        });

        this.subscriptions = subscriptions;
    }

    unsubscribe() {
        Object.keys(this.subscriptions).forEach(key => this.subscriptions[key]());
    }
}