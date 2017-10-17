import DashboardSwarmListener from "./DashboardSwarmListener";
import DashboardSwarmNode from "./DashboardSwarmNode";
import DashboardSwarmWebSocket from "./DashboardSwarmWebSocket";

class WindowsManager {

    constructor() {
        if (!WindowsManager.instance) {
            this.windows = {};
            this.windowsPromises = {};
            this.tabs = {};
            this.intervals = {};

            let wm = this;

            DashboardSwarmListener.subscribeEvent('serverTabs', tabs => {
                if (DashboardSwarmNode.isMaster()) wm.setTabs(tabs);
            });

            DashboardSwarmListener.subscribeCommand('openTab', (display, url, isFlash) => {
                if (DashboardSwarmNode.isMaster()) {
                    wm.openTab(display, url).then(tabId => {
                        let updateWhenTitleIsReady = (changedTabId, changeInfo, tab) => {
                            if (changedTabId === tabId && changeInfo.title !== undefined && changeInfo.title !== '') {
                                chrome.tabs.getZoom(tabId, zoom => {
                                    DashboardSwarmWebSocket.sendEvent('tabOpened', [tabId, display, url, changeInfo.title, tab.index, isFlash, zoom]);
                                });
                                chrome.tabs.onUpdated.removeListener(updateWhenTitleIsReady);
                            }
                        };

                        chrome.tabs.onUpdated.addListener(updateWhenTitleIsReady);
                    });
                }
            });

            DashboardSwarmListener.subscribeCommand('closeTab', tabId => {
                if (DashboardSwarmNode.isMaster() && wm.tabs[tabId] !== undefined) {
                    wm.closeTab(tabId).then(tabId => {
                        DashboardSwarmWebSocket.sendEvent('tabClosed', [tabId]);
                    });
                }
            });

            DashboardSwarmListener.subscribeCommand('updateTab', (tabId, newProps) => {
                if (DashboardSwarmNode.isMaster() && wm.getTab(tabId) !== undefined) {
                    if (newProps.position !== undefined) {
                        chrome.tabs.move(tabId, {index: newProps.position}, movedTab => {
                            chrome.windows.get(movedTab.windowId, {populate: true}, window => {
                                window.tabs.filter(wTab => wTab.index !== wm.getTab(wTab.id).position).forEach(wTab => {
                                    DashboardSwarmWebSocket.sendEvent('tabUpdated', [wTab.id, {position: wTab.index}]);
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
                                        DashboardSwarmWebSocket.sendEvent('tabUpdated', [tabId, newProps]);
                                        chrome.tabs.onUpdated.removeListener(updateWhenTitleIsReady);
                                    }
                                };

                                chrome.tabs.onUpdated.addListener(updateWhenTitleIsReady);
                            } else {
                                DashboardSwarmWebSocket.sendEvent('tabUpdated', [tabId, newProps]);
                            }
                        });
                    }

                    if (newProps.display !== undefined) {
                        wm.getWindowForDisplay(newProps.display).then(window => {
                            chrome.tabs.move(tabId, {windowId: window.id, index: -1}, tab => {
                                newProps.position = tab.index;
                                DashboardSwarmWebSocket.sendEvent('tabUpdated', [tabId, newProps]);
                            });
                        });
                    }

                    if (newProps.zoom !== undefined) {
                        chrome.tabs.setZoom(tabId, parseFloat(newProps.zoom), tab => {
                            if (newProps.title === undefined) {
                                DashboardSwarmWebSocket.sendEvent('tabUpdated', [tabId, newProps]);
                            }
                        });
                    }
                }
            });

            DashboardSwarmListener.subscribeCommand('getDisplays', () => {
                if (DashboardSwarmNode.isMaster()) {
                    wm.getDisplays().then(displays => {
                        DashboardSwarmWebSocket.sendEvent('masterDisplays', [displays]);
                    });
                }
            });

            DashboardSwarmListener.subscribeCommand('startRotation', interval => {
                if (DashboardSwarmNode.isMaster()) {
                    wm.getDisplays().then(displays => {
                        Object.keys(displays).forEach(display => {
                            if (wm.windows[display] !== undefined) {
                                wm.startRotation(display, interval);
                            }
                        })
                    });

                    DashboardSwarmWebSocket.sendEvent('rotationStarted', [interval]);
                }
            });

            DashboardSwarmListener.subscribeCommand('stopRotation', () => {
                if (DashboardSwarmNode.isMaster()) {
                    wm.getDisplays().then(displays => {
                        Object.keys(displays).forEach(display => {
                            if (wm.windows[display] !== undefined) {
                                wm.stopRotation(display);
                            }
                        })
                    });

                    DashboardSwarmWebSocket.sendEvent('rotationStopped', []);
                }
            });

            DashboardSwarmListener.subscribeCommand('reloadTab', tabId => {
                if (DashboardSwarmNode.isMaster()) {
                    chrome.tabs.reload(tabId);
                }
            });

            WindowsManager.instance = this;
        }

        return WindowsManager.instance;
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
        wm.closeEverything();

        tabs.sort((a, b) => a.position - b.position);
        tabs.forEach(tab => {
            wm.openTab(tab.display, tab.url).then(tabId => {
                DashboardSwarmWebSocket.sendEvent('tabUpdated', [tab.id, {id: tabId}]);
            });
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

                        // chrome.windows.update(createdWindow.id, {
                        //     'state': "fullscreen"
                        // }, function(window) {
                        //     console.log("Window " + createdWindow.id + " in fullscreen mode");
                        // });
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
        let wm = this;

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
     */
    closeEverything() {
        for (let windowId in this.windows) {
            if (this.windows.hasOwnProperty(windowId)) {
                chrome.windows.remove(windowId);
            }
        }
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
     */
    startRotation(display, interval) {
        let wm = this;

        let flashPause = {};

        wm.intervals[display] = setInterval(() => {
            if (!flashPause[display]) {
                if (wm.windows[display] !== undefined) { // Prevent re-opening a closed window
                    wm.getWindowForDisplay(display).then(w => {
                        chrome.windows.get(w.id, {populate: true}, window => {
                            let tabs = window.tabs.sort((a, b) => a.index - b.index);
                            let maxIndex = tabs[tabs.length - 1].index;
                            let activeTabIndex = tabs.findIndex(t => t.active === true);

                            let tabToActivate = activeTabIndex === maxIndex ? 0 : activeTabIndex + 1;

                            if (wm.getTab(tabs[tabToActivate].id).flash) {
                                flashPause[display] = 1;
                                setTimeout(() => flashPause[display] = 0, 2 * interval);
                            }

                            chrome.tabs.update(tabs[tabToActivate].id, {active: true});
                        });
                    });
                }
            }
        }, interval);

        DashboardSwarmWebSocket.sendEvent('rotationStarted', [interval]);
    }

    /**
     * Stop the rotation of thabs for a particular display
     * @param display Display you want to stop rotating
     */
    stopRotation(display) {
        let wm = this;

        if (wm.intervals[display] !== undefined) {
            clearInterval(wm.intervals[display]);
            delete wm.intervals[display];
        }

        DashboardSwarmWebSocket.sendEvent('rotationStopped');
    }
}

const instance = new WindowsManager();
Object.freeze(instance.instance);

export default instance;