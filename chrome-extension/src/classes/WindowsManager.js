class WindowsManager {

    constructor() {
        if (!WindowsManager.instance) {
            this.windows = {};
            this.windowsPromises = {};
            this.tabs = {};
            WindowsManager.instance = this;
        }

        return WindowsManager.instance;
    }

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

    getTab(id) {
        return this.tabs[id];
    }

    /**
     * Close everything and open those tabs
     * @param tabs [][screen, url]
     */
    setTabs(tabs) {

        this.closeEverything();

        for (let i in tabs) {
            if (tabs.hasOwnProperty(i)) {
                this.openTab(tabs[i][0], tabs[i][1]);
            }
        }

        this.tabs = tabs;
    }

    /**
     * Will resolve the tab ID
     * @param screen
     * @param tabUrl
     * @returns {Promise}
     */
    openTab(screen, tabUrl) {
        let wm = this;

        return new Promise((resolve, reject) => {
            try {
                this.getWindowForScreen(screen).then((window) => {
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
     * @param display
     * @returns Promise
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
                        console.log("Window " + createdWindow.id + " created");
                        wm.windows[display] = createdWindow;

                        let newWindowTabsId = createdWindow.tabs.map(tab => tab.id);

                        chrome.tabs.onCreated.addListener(tab => {
                            if (tab.windowId === createdWindow.id) {
                                chrome.tabs.remove(newWindowTabsId);
                            }
                        });

                        chrome.windows.onRemoved(window => delete wm.windowsPromises[window.id]);

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
    };

    closeTab(tabId) {
        return new Promise((resolve, reject) => chrome.tabs.remove(tabId, () => resolve(tabId)));
    };

    closeEverything() {
        for (windowId in this.windows) {
            if (this.windows.hasOwnProperty(windowId)) {
                chrome.windows.remove(windowId, () => {
                    console.log("Window " + windowId + " removed");
                });
            }
        }
    };

    dumpInternal() {
        this.getDisplays().then((data) => console.log(data));
        console.log(this.tabs);
        console.log(this.windows);
    };
}

const instance = new WindowsManager();
Object.freeze(instance.instance);

export default instance;