import TabProxy from "../channels/TabProxy";
import Rx from 'rxjs/Rx';
import Logger from "js-logger/src/logger";

const logger = Logger.get('WindowsManager');

export class WindowsManager {

    initInstanceVars() {
        this.windows = {};
        this.windowsPromises = {};
        this.tabs = {};
        this.intervals = {};
    }

    constructor(dsListener, dsNode) {
        this.dsListener = dsListener;

        this.initInstanceVars();

        let tabSubscription;

        dsNode.isMasterSubject().subscribe(isMaster => {
            if (isMaster === null) return;

            logger.info("master updated, master status : " + (isMaster ? "yes" : "no"));

            if (isMaster) {

                logger.info("this node is now master, broadcasting displays");
                this.getDisplays().then(displays => {
                    logger.debug("displays", displays);
                    dsListener.getDashboardSwarmWebSocket().sendEvent('masterDisplays', [displays]);
                });

                let tabs = dsNode.getTabs().getValue();

                if (tabs instanceof Array && tabs.length > 0) {
                    this.setTabs(tabs);
                }

            } else {
                if (tabSubscription) {
                    tabSubscription.unsubscribe();
                }
                this.closeEverything();
                dsListener.getDashboardSwarmWebSocket().sendEvent('masterDisplays', [null]);
            }
        });

        dsListener.subscribeCommand('openTab', (display, url, isFlash) => {
            if (dsNode.isMaster()) {
                this.openTab(display, url).then(tabId => {
                    let updateWhenTitleIsReady = (changedTabId, changeInfo, tab) => {
                        if (changedTabId === tabId && changeInfo.title !== undefined && changeInfo.title !== '') {
                            let scroll = {top: 0, left: 0};

                            chrome.tabs.getZoom(tabId, zoom => {
                                let flash = isFlash ? new Date() : undefined;
                                this.tabs[tab.id].flash = flash;
                                dsListener.getDashboardSwarmWebSocket().sendEvent('tabOpened', [tabId, display, url, changeInfo.title, tab.index, flash, zoom, scroll]);
                            });
                            chrome.tabs.onUpdated.removeListener(updateWhenTitleIsReady);
                        }
                    };

                    chrome.tabs.onUpdated.addListener(updateWhenTitleIsReady);
                });
            }
        });

        dsListener.subscribeCommand('closeTab', tabId => {
            if (dsNode.isMaster() && this.tabs[tabId] !== undefined) {
                this.closeTab(tabId).then(tabId => {
                    dsListener.sendEvent('tabClosed', [tabId]);
                });
            }
        });

        dsListener.subscribeCommand('updateTab', (tabId, newProps) => {
            if (dsNode.isMaster() && this.getTab(tabId) !== undefined) {
                if (newProps.position !== undefined) {
                    chrome.tabs.move(tabId, {index: newProps.position}, movedTab => {
                        chrome.windows.get(movedTab.windowId, {populate: true}, window => {
                            window.tabs.filter(wTab => wTab.index !== this.getTab(wTab.id).position).forEach(wTab => {
                                dsListener.sendEvent('tabUpdated', [wTab.id, {position: wTab.index}]);
                            })
                        });
                    });
                }

                if (newProps.url !== undefined) {
                    chrome.tabs.update(tabId, {url: newProps.url}, tab => {
                        if (newProps.title === undefined) {
                            let updateWhenTitleIsReady = (changedTabId, changeInfo, tab) => {
                                if (changedTabId === tabId && changeInfo.title !== undefined && changeInfo.title !== '') {
                                    newProps.title = changeInfo.title;
                                    dsListener.sendEvent('tabUpdated', [tabId, newProps]);
                                    chrome.tabs.onUpdated.removeListener(updateWhenTitleIsReady);
                                }
                            };

                            chrome.tabs.onUpdated.addListener(updateWhenTitleIsReady);
                        } else {
                            dsListener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tabId, newProps]);
                        }
                    });
                }

                if (newProps.display !== undefined) {
                    this.getWindowForDisplay(newProps.display).then(window => {
                        chrome.tabs.move(tabId, {windowId: window.id, index: -1}, tab => {
                            newProps.position = tab.index;
                            dsListener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tabId, newProps]);
                        });
                    });
                }

                if (newProps.zoom !== undefined) {
                    chrome.tabs.setZoom(tabId, parseFloat(newProps.zoom), tab => {
                        if (newProps.title === undefined) {
                            dsListener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tabId, newProps]);
                        }
                    });
                }

                if (newProps.scroll !== undefined) {
                    let tabProxy = new TabProxy(tabId);
                    tabProxy.scroll(newProps.scroll, response => {
                        dsListener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tabId, {scroll: response}]);
                    });
                }
            }
        });

        dsListener.subscribeCommand('getDisplays', () => {
            logger.debug("displays request received");
            if (dsNode.isMaster()) {
                this.getDisplays().then(displays => {
                    dsListener.getDashboardSwarmWebSocket().sendEvent('masterDisplays', [displays]);
                });
            }
        });

        dsListener.subscribeCommand('startRotation', (interval, intervalFlash) => {
            if (dsNode.isMaster()) {
                this.getDisplays().then(displays => {
                    Object.keys(displays).forEach(display => {
                        if (this.windows[display] !== undefined) {
                            this.startRotation(display, interval, intervalFlash);
                        }
                    })
                });
            }
        });

        dsListener.subscribeCommand('stopRotation', () => {
            if (dsNode.isMaster()) {
                this.getDisplays().then(displays => {
                    Object.keys(displays).forEach(display => {
                        if (this.windows[display] !== undefined) {
                            this.stopRotation(display);
                        }
                    })
                });
            }
        });

        dsListener.subscribeCommand('getRotationStatus', () => {
            if (dsNode.isMaster()) {
                dsListener.getDashboardSwarmWebSocket().sendEvent('rotationStatus', [this.intervals[0] !== undefined]);
            }
        });

        dsListener.subscribeCommand('reloadTab', tabId => {
            if (dsNode.isMaster()) {
                chrome.tabs.reload(tabId);
            }
        });

        dsListener.subscribeCommand('sendToForeground', tabId => {
            if (dsNode.isMaster()) {
                chrome.tabs.update(tabId, {active: true});
            }
        });

        dsListener.subscribeCommand('restartMaster', () => {
            if (dsNode.isMaster()) {
                this.closeEverything().then(windowClosedCount => {
                    chrome.runtime.reload();
                });
            }
        });
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
     * @param {Array<{display: number, url: string}>} tabs
     */
    setTabs(tabs) {
        this.closeEverything().then(windowClosedCount => {
            logger.debug("everything has been closed (" + windowClosedCount + " windows closed) ");
            setTimeout(() => {
                tabs.sort((a, b) => a.position - b.position);
                tabs.forEach(tab => {
                    this.openTab(tab.display, tab.url).then(tabId => {
                        this.dsListener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tab.id, {id: tabId}]);

                        setTimeout(() => {
                            chrome.tabs.setZoom(tab.id, (tab.zoom || 1), () => {
                                let tabScript = new TabProxy(tab.id);
                                tabScript.scrollTo(tab.scroll);
                            });
                        }, 2500);
                    });
                });
            }, 1000);
        });
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
                        resolve(tab.id);
                    });
                });

            } catch (err) {
                reject(err);
            }
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

                        resolve(createdWindow);

                        chrome.windows.update(createdWindow.id, {
                            'state': "fullscreen"
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
                    resolve(tabId);
                })

            } catch (err) {
                reject(err);
            }
        });
    }

    getWindowDisplay(windowId) {
        for (let i in this.windows) {
            if (this.windows.hasOwnProperty(i) && this.windows[i].id === windowId) {
                return i;
            }
        }
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

    dumpInternal() {
        this.getDisplays().then((data) => console.log(data));
        console.log(this.tabs);
        console.log(this.windows);
    }

    /**
     * Start the rotation of tabs for a particular display
     * @param {number} display Display you want to make rotate
     * @param {number} interval Pause duration between two tabs. In milliseconds
     * @param {number} intervalFlash Pause duration for a flash tab. In milliseconds
     */
    startRotation(display, interval, intervalFlash) {
        if (!interval || interval < 1 || !intervalFlash || intervalFlash < 1) {
            return;
        }

        let rotationStartDate;

        chrome.tabs.query({active: true, windowId: wm.windows[display].id}, tabs => {
            let tab = tabs[0];
            let tabDuration = this.getTab(tab.id).flash ? intervalFlash : interval;

            let tabScript = new TabProxy(tab.id);
            tabScript.rearmCountdown(tabDuration * 1000);
            rotationStartDate = new Date();
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
                        let tabScript = new TabProxy(tab.id);
                        tabScript.rearmCountdown(tabDuration * 1000);
                        rotationStartDate = new Date();
                    });
                });
            }

        }, 100);

        this.dsListener.getDashboardSwarmWebSocket().sendEvent('rotationStarted', [display, interval, intervalFlash]);
    }

    /**
     * Stop the rotation of thabs for a particular display
     * @param display Display you want to stop rotating
     */
    stopRotation(display) {
        let w = this.windows[display];

        if (this.intervals[display] !== undefined) {
            clearInterval(wm.intervals[display]);
            delete this.intervals[display];

            chrome.tabs.query({active: true, windowId: w.id}, tabs => {
                let tab = tabs[0];
                let tabScript = new TabProxy(tab.id);
                tabScript.clearCountdown();
            });
        }

        this.dsListener.getDashboardSwarmWebSocket().sendEvent('rotationStopped');
    }
}