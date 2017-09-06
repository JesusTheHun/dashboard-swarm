import DashboardSwarmListener from "./DashboardSwarmListener";
import DashboardSwarmNode from "./DashboardSwarmNode";
import DashboardSwarmWebSocket from "./DashboardSwarmWebSocket";

class WindowsManager {

    constructor() {
        if (!WindowsManager.instance) {
            this.windows = {};
            this.windowsPromises = {};
            this.tabs = {};

            let wm = this;

            DashboardSwarmListener.subscribeEvent('serverTabs', tabs => {
                if (DashboardSwarmNode.isMaster()) wm.setTabs(tabs);
            });

            DashboardSwarmListener.subscribeCommand('openTab', (screen, url) => {
                if (DashboardSwarmNode.isMaster()) {
                    wm.openTab(screen, url).then(tabId => {
                        DashboardSwarmWebSocket.sendEvent('tabOpened', [tabId, screen, url]);
                    });
                }
            });

            DashboardSwarmListener.subscribeCommand('closeTab', tabId => {
                if (DashboardSwarmNode.isMaster()) {
                    wm.closeTab(tabId).then(tabId => {
                        DashboardSwarmWebSocket.sendEvent('tabClosed', [tabId]);
                    });
                }
            });

            DashboardSwarmListener.subscribeCommand('getDisplays', () => {
                if (DashboardSwarmNode.isMaster()) {
                    wm.getDisplays().then(displays => {
                        DashboardSwarmWebSocket.sendEvent('masterDisplays', [displays]);
                    });
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
     * Close everything and open those tabs
     * @param tabs [][screen, url]
     */
    setTabs(tabs) {
        let wm = this;

        wm.closeEverything();

        tabs.forEach(tab => {
            wm.openTab(tab.screen, tab.url);
        });
    }

    /**
     * Open the tab and update WM's tab list. Will resolve the opened tab ID
     * @param {number} display
     * @param {string} tabUrl
     * @returns {Promise}
     */
    openTab(display, tabUrl) {
        let wm = this;

        return new Promise((resolve, reject) => {
            try {
                this.getWindowForScreen(display).then((window) => {
                    chrome.tabs.create({
                        windowId: window.id,
                        url: tabUrl,
                        active: true
                    }, tab => {
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
     * @returns {Promise} A promise that resolve the Window
     */
    getWindowForScreen(display) {
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
                        'left': displays[display].workArea.left
                    }, createdWindow => {
                        wm.windows[display] = createdWindow;

                        let newWindowTabsId = createdWindow.tabs.map(tab => tab.id);

                        let removeDefaultTabListener = tab => {
                            if (tab.windowId === createdWindow.id) {
                                chrome.tabs.remove(newWindowTabsId);
                                chrome.tabs.onCreated.removeListener(removeDefaultTabListener);
                            }
                        };

                        chrome.tabs.onCreated.addListener(removeDefaultTabListener);

                        let deleteWindowPromiseListener = window => {
                            delete wm.windowsPromises[window.id];
                            chrome.windows.onRemoved.removeListener(deleteWindowPromiseListener);
                        };

                        chrome.windows.onRemoved.addListener(deleteWindowPromiseListener);

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
        return new Promise((resolve, reject) => chrome.tabs.remove(tabId, () => resolve(tabId)));
    }

    /**
     * Close everything :D Send a tabClosed event for each tab closed.
     */
    closeEverything() {
        for (let windowId in this.windows) {
            if (this.windows.hasOwnProperty(windowId)) {
                chrome.windows.remove(windowId, () => {
                    console.log("Window " + windowId + " removed");

                    this.windows[windowId].tabs.forEach(tab => {
                        DashboardSwarmWebSocket.sendEvent('tabClosed', [tab.id]);
                    });
                });
            }
        }
    }

    dumpInternal() {
        this.getDisplays().then((data) => console.log(data));
        console.log(this.tabs);
        console.log(this.windows);
    }
}

const instance = new WindowsManager();
Object.freeze(instance.instance);

export default instance;