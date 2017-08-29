class WindowsManager {

    constructor() {
        if (!WindowsManager.instance) {
            this.windows = {};
            this.tabs = {};
            WindowsManager.instance = this;
        }

        return WindowsManager.instance;
    }

    getDisplays() {
        return new Promise((resolve, reject) => {
            try {
                chrome.system.display.getInfo(function (displayInfos) {
                    resolve(displayInfos);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    setTabs(_tabs) {
        this.tabs = _tabs;
    }

    openTab(screen, tabUrl) {
        return new Promise((resolve, reject) => {
            try {

                let getWindow = (_screen) => {
                    return new Promise(function (resolve, reject) {
                        if (windows[_screen] !== undefined) {
                            resolve(windows[_screen]);
                        }

                        getDisplays().then(displays => {
                            chrome.windows.create({
                                'left': displays[_screen].workArea.left
                            }, createdWindow => {
                                console.log("Window " + createdWindow.id + " created");
                                windows[_screen] = createdWindow;

                                resolve(createdWindow);

                                // chrome.windows.update(createdWindow.id, {
                                //     'state': "fullscreen"
                                // }, function(window) {
                                //     console.log("Window " + createdWindow.id + " in fullscreen mode");
                                // });
                            });
                        });
                    });
                };

                getWindow(screen).then((window) => {
                    chrome.tabs.create({
                        windowId: window.id,
                        url: tabUrl,
                        active: true
                    }, tab => {
                        tabs[tab.id] = tab;
                        resolve(tab.id);
                    });
                });

            } catch (err) {
                reject(err);
            }
        });
    }

    closeTab(screen, tabId) {
        chrome.tabs.remove(tabId);
    };

    closeEverything() {
        for (windowId in windows) {
            if (windows.hasOwnProperty(windowId)) {
                chrome.windows.remove(windowId, () => {
                    console.log("Window " + windowId + " removed");
                });
            }
        }
    };

    dumpInternal() {
        getDisplays().then((data) => console.log(data));
        console.log(this.tabs);
        console.log(this.windows);
    };
}

const instance = new WindowsManager();
Object.freeze(instance.instance);

export default instance;