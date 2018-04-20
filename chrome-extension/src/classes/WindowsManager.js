import TabProxy from "../channels/TabProxy";
import Rx from 'rxjs/Rx';
import Logger from "js-logger/src/logger";

const logger = Logger.get('WindowsManager');
const TAB_LISTENING = 0;
const TAB_WAITING = 1;
const TAB_READY = 2;

export class WindowsManager {

    initInstanceVars() {
        this.windows = {};
        this.windowsPromises = {};
        this.tabs = {};
        this.intervals = {};
        this.tabsStatus = new Rx.BehaviorSubject({});
        this.tabReadyPromise = {};
    }

    constructor(dsListener) {
        this.listener = dsListener;
        this.initInstanceVars();

        // Listen to add-on input of page status
        this.tabsReadyStateListener = (request, sender, response) => {
            let tabId = sender.tab.id;

            if (request.action === 'tabWaitingAddon') {
                logger.debug("tab " + tabId + " marked as waiting addon");
                this.setTabStatus(tabId, TAB_WAITING);
            }

            if (request.action === 'tabReady') {
                logger.debug("tab " + tabId + " marked as ready");
                this.setTabStatus(tabId, TAB_READY);
            }
        };

        chrome.runtime.onMessageExternal.addListener(this.tabsReadyStateListener);

        // Local input of page status
        this.tabsReadyStateListener = (request, sender, response) => {
            let tabId = sender.tab.id;

            if (request.action === 'tabListening') {
                if (this.getTabStatus(tabId) === null) {
                    logger.debug("tab " + tabId + " marked as listening");
                    this.setTabStatus(tabId, TAB_LISTENING);
                }
            }
        };

        chrome.runtime.onMessage.addListener(this.tabsReadyStateListener);
    }

    /**
     * @returns {Promise} A promise that resolve the displays list
     */
    getDisplays() {
        return new Promise((resolve, reject) => {
            try {
                chrome.system.display.getInfo(displayInfos => {
                    resolve(displayInfos);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * @param {number} id Tab ID you want
     * @returns {Tab} Chrome's Tab object
     */
    getTab(id) {
        return this.tabs[id];
    }

    /**
     * @returns {Tab[]} Return all tabs
     */
    getTabs() {
        return this.tabs;
    }

    /**
     * Close everything and open those tabs. Tabs are sorted by position.
     * @param {Array<{display: number, url: string, position: number}>} tabs
     */
    setTabs(tabs) {
        if (tabs.length === 0 && Object.keys(this.windows).length === 0 && Object.keys(this.windowsPromises).length === 0) {
            return;
        }

        return this.closeEverything().then(windowClosedCount => {
            logger.debug("everything has been closed (" + windowClosedCount + " windows closed) ");
            setTimeout(() => {
                tabs.sort((a, b) => a.position - b.position);
                tabs.forEach(tab => {
                    this.openTab(tab.display, tab.url).then(tabId => {
                        this.listener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tab.id, {id: tabId}]);

                        this.onTabReady(tabId).then(() => {
                            logger.debug("tab is ready", tabId);
                            chrome.tabs.setZoom(tabId, (tab.zoom || 1), () => {
                                logger.debug("zoom set", tabId);
                                logger.debug("calling scroll", tabId, tab.scroll);
                                new TabProxy(tabId).scrollTo(tab.scroll);
                            });
                        });
                    });
                });
            }, 1000);
        });
    }

    setTabStatus(tabId, status) {
        let value = this.tabsStatus.getValue();
        value[tabId] =  status;
        this.tabsStatus.next(value);
    }

    getTabStatus(tabId) {
        return this.tabsStatus.getValue()[tabId];
    }

    onTabReady(tabId) {
        return this.tabReadyPromise[tabId];
    }

    /**
     * Open the tab and update WM's tab list. Will resolve the opened tab ID
     * @param {number} display
     * @param {string} tabUrl
     * @returns {Promise<number>} A promise that resolve the tab ID
     */
    openTab(display, tabUrl) {
        return new Promise((resolve, reject) => {
            try {
                this.getWindowForDisplay(display).then((window) => {
                    chrome.tabs.create({ windowId: window.id, url: tabUrl, active: true}, tab => {
                        this.tabs[tab.id] = tab;
                        this.setTabStatus(tab.id, null);
                        this.initTabReadyPromise(tab.id);
                        resolve(tab.id);
                    });
                });

            } catch (err) {
                reject(err);
            }
        });
    }

    initTabReadyPromise(tabId) {
        this.tabReadyPromise[tabId] = new Promise((res, rej) => {
            logger.debug("init tabReady promise", tabId);

            let sub;
            let listeningTimeout;

            sub = this.tabsStatus.subscribe(tabsStatus => {
                if (tabsStatus[tabId] === TAB_LISTENING) {
                    logger.debug("status listening, starting timeout", tabId);
                    listeningTimeout = setTimeout(() => res(), 2500);
                }

                if (tabsStatus[tabId] === TAB_WAITING) {
                    logger.debug("status waiting, clearing timeout", tabId);
                    clearTimeout(listeningTimeout);
                }

                if (tabsStatus[tabId] === TAB_READY) {
                    logger.debug("status ready reached", tabId);
                    res();
                    sub.unsubscribe();
                }
            });
        });
    }

    /**
     * Return a promise that resolve the Window
     * @param {number} display
     * @returns {Promise<Window>} A promise that resolve the Window
     */
    getWindowForDisplay(display) {
        if (this.windows[display] !== undefined) {
            return new Promise((resolve, reject) => resolve(this.windows[display]));
        }

        if (this.windowsPromises[display] !== undefined) {
            return this.windowsPromises[display];
        }

        this.windowsPromises[display] = new Promise((resolve, reject) => {
            this.getDisplays().then(displays => {
                try {
                    chrome.windows.create({
                        'top': displays[display].workArea.top,
                        'left': displays[display].workArea.left
                    }, createdWindow => {
                        this.windows[display] = createdWindow;

                        let newWindowTabsId = createdWindow.tabs.map(tab => tab.id);

                        let onCreateRemoveDefaultTabListener = tab => {
                            if (tab.windowId === createdWindow.id) {
                                chrome.tabs.remove(newWindowTabsId);
                                chrome.tabs.onCreated.removeListener(onCreateRemoveDefaultTabListener);
                                chrome.tabs.onAttached.removeListener(onAttachedRemoveDefaultTabListener);
                            }
                        };

                        let onAttachedRemoveDefaultTabListener = (tabId, attachInfo) => {
                            if (attachInfo.newWindowId === createdWindow.id) {
                                chrome.tabs.remove(newWindowTabsId);
                                chrome.tabs.onCreated.removeListener(onCreateRemoveDefaultTabListener);
                                chrome.tabs.onAttached.removeListener(onAttachedRemoveDefaultTabListener);
                            }
                        };

                        chrome.tabs.onCreated.addListener(onCreateRemoveDefaultTabListener);
                        chrome.tabs.onAttached.addListener(onAttachedRemoveDefaultTabListener);

                        chrome.windows.onRemoved.addListener(windowId => {
                            if (windowId === createdWindow.id) {
                                delete this.windowsPromises[display];
                                delete this.windows[display];
                            }
                        });

                        chrome.windows.update(createdWindow.id, {
                            'state': "fullscreen"
                        }, (window) => {
                            resolve(createdWindow);
                        });

                    });
                } catch (err) {
                    reject(err);
                }
            });
        });

        return this.windowsPromises[display];
    }

    /**
     * @param {number} tabId
     * @returns {Promise}
     */
    closeTab(tabId) {
        return new Promise((resolve, reject) => {
            try {
                chrome.tabs.remove(tabId, () => {
                    delete this.tabs[tabId];
                    resolve(tabId);
                })

            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Close everything. No event is emited
     * @return Promise<number>
     */
    closeEverything() {
        let closed = new Rx.BehaviorSubject(0);
        let toBeClosed = Object.keys(this.windows).length;

        logger.debug("closing everything, " + toBeClosed + " windows to be closed");
        logger.debug(this.windows);

        for (let windowId in this.windows) {
            if (this.windows.hasOwnProperty(windowId)) {
                chrome.windows.remove(this.windows[windowId].id, () => {
                    closed.next(closed.getValue() + 1);
                });
            }
        }

        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => reject("Close command timeout"), 1000);

            closed.subscribe(newValue => {
                if (toBeClosed === newValue) {
                    this.initInstanceVars();
                    clearTimeout(timeout);
                    resolve(toBeClosed);
                }
            });
        });
    }

    startRotation(interval, intervalFlash) {
        this.getDisplays().then(displays => {
            Object.keys(displays).forEach(display => {
                if (this.windows[display] !== undefined) {
                    this.startRotationForDisplay(display, interval, intervalFlash);
                }
            })
        });
    }

    /**
     * Start the rotation of tabs for a particular display
     * @param {number} display Display you want to make rotate
     * @param {number} interval Pause duration between two tabs. In milliseconds
     * @param {number} intervalFlash Pause duration for a flash tab. In milliseconds
     */
    startRotationForDisplay(display, interval, intervalFlash) {
        if (!interval || interval < 1 || !intervalFlash || intervalFlash < 1) {
            return;
        }

        let rotationStartDate;

        chrome.tabs.query({active: true, windowId: this.windows[display].id}, tabs => {
            let tab = tabs[0];
            let tabDuration = this.getTab(tab.id).flash ? intervalFlash : interval;

            this.onTabReady(tab.id).then(() => {
                new TabProxy(tab.id).rearmCountdown(tabDuration * 1000);
                rotationStartDate = new Date();
            });
        });

        this.intervals[display] = setInterval(() => {
            if (rotationStartDate === undefined) {
                return;
            }

            if (this.windows[display] !== undefined) { // Prevent re-opening a closed window

                let elapsedMilliseconds = new Date() - rotationStartDate;

                chrome.windows.get(this.windows[display].id, {populate: true}, window => {
                    let tabs = window.tabs.sort((a, b) => a.index - b.index);
                    let activeTab = tabs.find(t => t.active === true);

                    let maxIndex = tabs[tabs.length - 1].index;
                    let activeTabIndex = tabs.findIndex(t => t.active === true);
                    let tabToActivate = activeTabIndex === maxIndex ? 0 : activeTabIndex + 1;
                    let nextTabId = tabs[tabToActivate].id;

                    let tabDuration = this.getTab(activeTab.id).flash ? intervalFlash : interval;

                    if (elapsedMilliseconds < (tabDuration * 1000)) {
                        return;
                    }

                    chrome.tabs.update(nextTabId, {active: true}, tab => {
                        this.onTabReady(tab.id).then(() => {
                            new TabProxy(tab.id).rearmCountdown(tabDuration * 1000);
                            rotationStartDate = new Date();
                        });
                    });
                });
            }

        }, 100);

        this.listener.getDashboardSwarmWebSocket().sendEvent('rotationStarted', [display, interval, intervalFlash]);
    }

    /**
     * Stop the rotation of thabs for a particular display
     * @param display Display you want to stop rotating
     */
    stopRotationForDisplay(display) {
        let w = this.windows[display];

        if (this.intervals[display] !== undefined) {
            clearInterval(this.intervals[display]);
            delete this.intervals[display];

            chrome.tabs.query({active: true, windowId: w.id}, tabs => {
                let tab = tabs[0];

                this.onTabReady(tab.id).then(() => {
                    new TabProxy(tab.id).clearCountdown();
                });
            });
        }
    }

    stopRotation() {
        logger.debug("stopping rotation", this.windows);
        this.getDisplays().then(displays => {
            Object.keys(displays).forEach(display => {
                logger.debug("stopping rotation of display", display);
                if (this.windows[display] !== undefined) {
                    this.stopRotationForDisplay(display);
                }
            })
        }).then(() => this.listener.getDashboardSwarmWebSocket().sendEvent('rotationStopped'));
    }

    setTabPosition(tabId, position) {
        chrome.tabs.move(tabId, {index: position}, movedTab => {
            chrome.windows.get(movedTab.windowId, {populate: true}, window => {
                window.tabs.filter(wTab => wTab.index !== this.getTab(wTab.id).position).forEach(wTab => {
                    this.listener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [wTab.id, {position: wTab.index}]);
                })
            });
        });
    }

    setTabUrl(tabId, url) {
        chrome.tabs.update(tabId, {url: url}, tab => {
            let updateWhenTitleIsReady = (changedTabId, changeInfo, tab) => {
                if (changedTabId === tabId && changeInfo.title !== undefined && changeInfo.title !== '') {
                    this.listener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tabId, {url, title: changeInfo.title}]);
                    chrome.tabs.onUpdated.removeListener(updateWhenTitleIsReady);
                }
            };

            chrome.tabs.onUpdated.addListener(updateWhenTitleIsReady);
        });
    }

    setTabDisplay(tabId, display) {
        this.getWindowForDisplay(display).then(window => {
            chrome.tabs.move(tabId, {windowId: window.id, index: -1}, tab => {
                let newProps = {display};
                newProps.position = tab.index;
                this.listener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tabId, newProps]);
            });
        });
    }

    setTabZoom(tabId, zoom) {
        this.onTabReady(tabId).then(() => {
            chrome.tabs.setZoom(tabId, parseFloat(zoom), tab => {
                this.listener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tabId, {zoom}]);
            });
        });
    }

    setTabScroll(tabId, scroll) {
        this.onTabReady(tabId).then(() => {
            new TabProxy(tabId).scroll(scroll, response => {
                this.listener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tabId, {scroll: response}]);
            });
        });
    }

    isRotationActive() {
        return this.intervals[0] !== undefined;
    }

    releaseTheKraken(tabId) {
        this.onTabReady(tabId).then(() => {
            new TabProxy(tabId).releaseTheKraken();
        });
    }
}