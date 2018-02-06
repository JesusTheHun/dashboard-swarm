import TabProxy from "../channels/TabProxy";
import Rx from 'rxjs/Rx';

export class WindowsManager {

    constructor(dsListener, dsNode) {
        this.dsListener = dsListener;

        this.windows = {};
        this.windowsPromises = {};
        this.tabs = {};
        this.intervals = {};

        let wm = this;

        dsListener.subscribeEvent('serverTabs', tabs => {
            if (dsNode.isMaster()) wm.setTabs(tabs);
        });

        dsListener.subscribeCommand('openTab', (display, url, isFlash) => {
            if (dsNode.isMaster()) {
                wm.openTab(display, url).then(tabId => {
                    let updateWhenTitleIsReady = (changedTabId, changeInfo, tab) => {
                        if (changedTabId === tabId && changeInfo.title !== undefined && changeInfo.title !== '') {
                            let scroll = {top: 0, left: 0};

                            chrome.tabs.getZoom(tabId, zoom => {
                                let flash = isFlash ? new Date() : undefined;
                                wm.tabs[tab.id].flash = flash;
                                dsListener.sendEvent('tabOpened', [tabId, display, url, changeInfo.title, tab.index, flash, zoom, scroll]);
                            });
                            chrome.tabs.onUpdated.removeListener(updateWhenTitleIsReady);
                        }
                    };

                    chrome.tabs.onUpdated.addListener(updateWhenTitleIsReady);
                });
            }
        });

        dsListener.subscribeCommand('closeTab', tabId => {
            if (dsNode.isMaster() && wm.tabs[tabId] !== undefined) {
                wm.closeTab(tabId).then(tabId => {
                    dsListener.sendEvent('tabClosed', [tabId]);
                });
            }
        });

        dsListener.subscribeCommand('updateTab', (tabId, newProps) => {
            if (dsNode.isMaster() && wm.getTab(tabId) !== undefined) {
                if (newProps.position !== undefined) {
                    chrome.tabs.move(tabId, {index: newProps.position}, movedTab => {
                        chrome.windows.get(movedTab.windowId, {populate: true}, window => {
                            window.tabs.filter(wTab => wTab.index !== wm.getTab(wTab.id).position).forEach(wTab => {
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
                    wm.getWindowForDisplay(newProps.display).then(window => {
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
            if (dsNode.isMaster()) {
                wm.getDisplays().then(displays => {
                    dsListener.getDashboardSwarmWebSocket().sendEvent('masterDisplays', [displays]);
                });
            }
        });

        dsListener.subscribeCommand('startRotation', (interval, intervalFlash) => {
            if (dsNode.isMaster()) {
                wm.getDisplays().then(displays => {
                    Object.keys(displays).forEach(display => {
                        if (wm.windows[display] !== undefined) {
                            wm.startRotation(display, interval, intervalFlash);
                        }
                    })
                });
            }
        });

        dsListener.subscribeCommand('stopRotation', () => {
            if (dsNode.isMaster()) {
                wm.getDisplays().then(displays => {
                    Object.keys(displays).forEach(display => {
                        if (wm.windows[display] !== undefined) {
                            wm.stopRotation(display);
                        }
                    })
                });
            }
        });

        dsListener.subscribeCommand('getRotationStatus', () => {
            if (dsNode.isMaster()) {
                dsListener.getDashboardSwarmWebSocket().sendEvent('rotationStatus', [wm.intervals[0] !== undefined]);
            }
        });

            dsListener.subscribeCommand('reloadTab', tabId => {
                if (dsNode.isMaster()) {
                    chrome.tabs.reload(tabId, () => {
                        //setTimeout(() => {
                            //chrome.tabs.executeScript(tabId, {file: "build/contentScript.js"});
                            //chrome.tabs.insertCSS(tabId, {file: "build/content_script/keyframe.css"});
                        //}, 500);
                    });
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
        let wm = this;
        wm.closeEverything().then(windowClosedCount => {
            setTimeout(() => {
                tabs.sort((a, b) => a.position - b.position);
                tabs.forEach(tab => {
                    wm.openTab(tab.display, tab.url).then(tabId => {
                        dsListener.getDashboardSwarmWebSocket().sendEvent('tabUpdated', [tab.id, {id: tabId}]);

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
        let wm = this;

        return new Promise((resolve, reject) => {
            try {
                this.getWindowForDisplay(display).then((window) => {
                    chrome.tabs.create({ windowId: window.id, url: tabUrl, active: true}, tab => {
                        wm.tabs[tab.id] = tab;
                        // chrome.tabs.executeScript(tab.id, {file: "build/contentScript.js"});
                        // chrome.tabs.insertCSS(tab.id, {file: "build/content_script/keyframe.css"});
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
        let wm = this;

        if (wm.windows[display] !== undefined) {
            return new Promise((resolve, reject) => resolve(wm.windows[display]));
        }

        if (this.windowsPromises[display] !== undefined) {
            return this.windowsPromises[display];
        }

        this.windowsPromises[display] = new Promise((resolve, reject) => {
            wm.getDisplays().then(displays => {
                try {
                    chrome.windows.create({
                        'top': displays[display].workArea.top,
                        'left': displays[display].workArea.left
                    }, createdWindow => {
                        wm.windows[display] = createdWindow;

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
                                delete wm.windowsPromises[display];
                                delete wm.windows[display];
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
        let toBeClosed = this.windows.length;

        for (let windowId in this.windows) {
            if (this.windows.hasOwnProperty(windowId)) {
                chrome.windows.remove(this.windows[windowId].id, () => {
                    closed.next(closed.getValue() + 1);
                });
            }
        }

        return new Promise((resolve, reject) => {
            closed.subscribe(newValue => {
                if (toBeClosed === newValue) {
                    resolve(closed);
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

        let wm = this;
        let rotationStartDate;

        chrome.tabs.query({active: true, windowId: wm.windows[display].id}, tabs => {
            let tab = tabs[0];
            let tabDuration = wm.getTab(tab.id).flash ? intervalFlash : interval;

            let tabScript = new TabProxy(tab.id);
            tabScript.rearmCountdown(tabDuration * 1000);
            rotationStartDate = new Date();
        });

        wm.intervals[display] = setInterval(() => {
            if (rotationStartDate === undefined) {
                return;
            }

            if (wm.windows[display] !== undefined) { // Prevent re-opening a closed window

                let elapsedMilliseconds = new Date() - rotationStartDate;

                chrome.windows.get(wm.windows[display].id, {populate: true}, window => {
                    let tabs = window.tabs.sort((a, b) => a.index - b.index);
                    let activeTab = tabs.find(t => t.active === true);

                    let maxIndex = tabs[tabs.length - 1].index;
                    let activeTabIndex = tabs.findIndex(t => t.active === true);
                    let tabToActivate = activeTabIndex === maxIndex ? 0 : activeTabIndex + 1;
                    let nextTabId = tabs[tabToActivate].id;

                    let tabDuration = wm.getTab(activeTab.id).flash ? intervalFlash : interval;

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
        let wm = this;
        let w = wm.windows[display];

        if (wm.intervals[display] !== undefined) {
            clearInterval(wm.intervals[display]);
            delete wm.intervals[display];

            chrome.tabs.query({active: true, windowId: w.id}, tabs => {
                let tab = tabs[0];
                let tabScript = new TabProxy(tab.id);
                tabScript.clearCountdown();
            });
        }

        this.dsListener.getDashboardSwarmWebSocket().sendEvent('rotationStopped');
    }
}