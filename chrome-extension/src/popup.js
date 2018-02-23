/**
 * TODO Need to clear this whole mess, make a proper stateful object
 */

import Rx from 'rxjs/Rx';
import nodeProxy from './channels/NodeProxy';

import { showTabTools } from './popup_tabTools';
import Logger from './logger';
import {Parameters} from "./classes/Parameters";
import { editableTextNode} from "./function/editableTextNode";

const logger = Logger.get('popup');
const NodeProxy = new nodeProxy();

let waitingMaster = null;
let activePanelTab = 0;

class Popup {

    constructor() {
        this.tabsSubject = new Rx.BehaviorSubject([]);
        this.displaysSubject = new Rx.BehaviorSubject({});
        this.globalPlayerSubject = new Rx.BehaviorSubject(false);
        this.waitingMaster = null;

        // Listen displays, tabs, connections, player
        NodeProxy.on('connectionSuccess', () => {
            this.boot();
        });

        NodeProxy.on('getTabs', tabs => {
            this.tabsSubject.next(tabs);
        });

        NodeProxy.on('getDisplays', displays => {
            this.hideWaitingMaster();
            this.displaysSubject.next(displays);
        });

        NodeProxy.on('rotationStatus', status => {
            this.globalPlayerSubject.next(status);
        });
        NodeProxy.on('rotationStarted', () => this.globalPlayerSubject.next(true));
        NodeProxy.on('rotationStopped', () => this.globalPlayerSubject.next(false));

        NodeProxy.on('tabOpened', tab => {
            let currentTabs = this.tabsSubject.getValue();
            currentTabs.push(tab);
            this.tabsSubject.next(currentTabs);
        });

        NodeProxy.on('tabClosed', tabId => {
            let currentTabs = this.tabsSubject.getValue();
            let tabIdx = currentTabs.findIndex(tab => tab.id === tabId);
            currentTabs.splice(tabIdx, 1);
            this.tabsSubject.next(currentTabs);
        });

        NodeProxy.on('tabUpdated', (tabId, newProps) => {
            let currentTabs = this.tabsSubject.getValue();

            if (!currentTabs) {
                logger.error("Whoops, empty tabs !");
                return;
            }

            let updatedTab = currentTabs.find(t => t.id === tabId);

            Object.assign(updatedTab, newProps);
            this.tabsSubject.next(currentTabs);
        });
    }

    boot() {
        this.showWaitingMaster();
        this.refresh();
        // Wait for master signal
        // Ask for displays, tabs, player
        // showUI when response is received
    }

    reset() {
        this.tabsSubject.next([]);
        this.displaysSubject.next({});
        this.globalPlayerSubject.next(false);
        this.showWaitingMaster();
    }

    refresh() {
        NodeProxy.refresh();
    }

    showUI() {
        let domPanelTabBlock = document.querySelector('#displays .panel ul.tab-block');

        displaysSubject.subscribe(displays => {
            this.clearTabsSpace();

            if (displays === null || Object.keys(displays).length === 0) {
                return;
            }

            for (let i in displays) {
                if (displays.hasOwnProperty(i)) {
                    let domPanelTab = document.createElement('li');
                    domPanelTab.classList.add('tab-item');

                    let domPanelTabLink = document.createElement('a');
                    domPanelTabLink.href = '#';
                    domPanelTabLink.textContent = this.getDisplayName(i);

                    domPanelTab.appendChild(domPanelTabLink);
                    domPanelTabBlock.appendChild(domPanelTab);

                    domPanelTabLink.addEventListener('click', () => {
                        let currentlyActiveTab = domPanelTabBlock.querySelector('.tab-item.active');
                        if (currentlyActiveTab !== null) {
                            currentlyActiveTab.classList.remove('active');
                            activePanelTab = Array.prototype.indexOf.call(domPanelTabBlock.childNodes, currentlyActiveTab);
                        }

                        activePanelTab = parseInt(i);
                        domPanelTab.classList.add('active');
                        this.showTabsForDisplay(parseInt(i));
                    });
                }
            }

            let firstDisplay = domPanelTabBlock.querySelector('.panel-nav .tab-item:first-child a');

            if (firstDisplay) {
                firstDisplay.dispatchEvent(new Event('click'));
            }
        });

        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            let tab = tabs[0];

            if (tab !== undefined && tab.url !== undefined) {
                document.getElementById('dashboardUrl').value = tab.url;
            }
        });

        document.getElementById('addDashboard').addEventListener('click', () => {
            this.askOpenTab(false);
        });

        document.getElementById('addDashboardFlash').addEventListener('click', () => {
            this.askOpenTab(true);
        });

        document.getElementById('dashboardUrl').addEventListener('keydown', (e) => {
            if (e.keyCode === 13) {
                this.askOpenTab(false);
            }
        });

        document.getElementById('playPause').addEventListener('click', () => {
            let isPlaying = this.globalPlayerSubject.getValue();

            if (isPlaying) {
                NodeProxy.stopRotation();
            } else {
                NodeProxy.startRotation();
            }
        });

        this.globalPlayerSubject.subscribe(isPlaying => {
            let icon = document.getElementById('playPause').querySelector('i');
            icon.classList.remove('fa-play');
            icon.classList.remove('fa-stop');
            icon.classList.add(isPlaying === true ? 'fa-stop' : 'fa-play');
        });

        ////////////
        // Config //
        ////////////

        let configLink = document.querySelector('#configLink');
        configLink.addEventListener('click', e => {
            e.preventDefault();

            document.querySelector('div#displays').style.display = 'none';
            document.querySelector('div#config').style.display = 'block';
        });

        let closeConfigLink = document.querySelector('#closeConfigLink');

        closeConfigLink.addEventListener('click', e => {
            e.preventDefault();

            document.querySelector('div#displays').style.display = 'block';
            document.querySelector('div#config').style.display = 'none';
        });

        let parameters = document.querySelector('#parameters');
        parameters.setAttribute('disabled', 'disabled');

        let isConnected = false;

        document.querySelector('#connect').addEventListener('click', e => {
            e.preventDefault();

            if (isConnected) {
                this.disconnect(e, response => {
                    isConnected = response;
                });
            } else {
                this.connect(e, response => {
                    isConnected = response;

                    if (!isConnected) {
                        return;
                    }

                    let configOptions = Parameters.getParametersName();

                    NodeProxy.on('serverConfig', config => {
                        configOptions.forEach(configName => {
                            let value = '';
                            if (config[configName] !== undefined) {
                                value = config[configName];
                            }

                            let input = document.querySelector('#' + configName);

                            if (input) {
                                input.value = value;
                            }
                        });
                    });

                    NodeProxy.getConfig();

                    document.querySelector('#save').addEventListener('click', e => {
                        e.preventDefault();

                        let newConfig = {};

                        configOptions.forEach(configName => {
                            let input = document.querySelector('#' + configName);
                            newConfig[configName] = input.value;
                        });

                        chrome.storage.sync.set({
                            server: document.querySelector('#serverUrl').value
                        });

                        NodeProxy.setConfig(newConfig);

                        e.target.classList.add('successBackground');

                        setTimeout(() => {
                            e.target.classList.remove('successBackground');
                        }, 500);
                    });
                });
            }
        });

        chrome.storage.sync.get({
            master: false,
            server: 'localhost:8080'
        }, function(currentConfig) {

            document.querySelector('#serverUrl').value = currentConfig.server;
            document.querySelector('#master').checked = currentConfig.master;

            document.querySelector('#master').addEventListener('change', e => {
                logger.info("This node is now master : " + (e.target.checked ? "yes" : "no"));
                chrome.storage.sync.set({
                    master: e.target.checked
                });
            });
        });

        document.querySelector('#restart').addEventListener('click', (e) => {
            e.preventDefault();
            NodeProxy.restart();
        });
    }

    hideUI() {

    }

    showWaitingMaster() {
        if (waitingMaster) {
            return;
        }

        waitingMaster = document.getElementById('waitingMaster').cloneNode(true);
        waitingMaster.removeAttribute('id');
        waitingMaster.classList.remove('hide');
        document.querySelector('#displays .panel .panel-body').appendChild(waitingMaster);
    }

    hideWaitingMaster() {
        if (!waitingMaster) {
            return;
        }

        waitingMaster.remove();
        waitingMaster = null;
    }

    clearTabsSpace() {
        let domPanelTabBlock = document.querySelector('#displays .panel ul.tab-block');

        if (domPanelTabBlock) {
            while (domPanelTabBlock.firstChild) {
                domPanelTabBlock.removeChild(domPanelTabBlock.firstChild);
            }

            let domPanelBody = document.querySelector('#displays .panel .panel-body');

            while (domPanelBody.firstChild) {
                domPanelBody.removeChild(domPanelBody.firstChild);
            }
        }
    }

    askOpenTab(isFlash) {
        if (isFlash === undefined) {
            isFlash = false;
        }

        let dashboardUrl = document.getElementById('dashboardUrl').value;
        if (dashboardUrl !== "") {
            chrome.runtime.sendMessage({node: "openTab", args: [activePanelTab, dashboardUrl, isFlash]});
            document.getElementById('dashboardUrl').value = '';
        }
    }

    showTabsForDisplay(display) {
        let domEmptyState = document.getElementById('empty');
        let domPanelBody = document.querySelector('#displays .panel .panel-body');

        this.tabsSubject.subscribe(tabs => {
            if (!tabs) {
                return;
            }

            tabs.sort((a, b) => a.position - b.position);
            // Clear previous content
            while (domPanelBody.firstChild) {
                domPanelBody.removeChild(domPanelBody.firstChild);
            }

            // Assemble new content
            let displayTabs = tabs.filter(tab => tab.display === display);

            if (displayTabs.length === 0) {
                let domEmptyStateClone = domEmptyState.cloneNode(true);
                domEmptyStateClone.removeAttribute('id');
                domPanelBody.appendChild(domEmptyStateClone);
                return;
            }

            displayTabs.map(tab => this.addTabToPanel(tab));
        });
    }

    addTabToPanel(tab) {
        let tabId = tab.id;
        let tabUrl = tab.url;
        let tabTitle = tab.title;

        let domPanelBody = document.querySelector('#displays .panel .panel-body');

        let domTabTile = document.querySelector('#tabTemplate').cloneNode(true);
        domTabTile.removeAttribute('id');
        domTabTile.setAttribute('data-tabId', tabId);

        domTabTile.querySelector('.icon-column .js-moveup').addEventListener('click', e => {
            let tab = this.tabsSubject.getValue().find(t => t.id === tabId);

            if (tab.position > 0) {
                chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {position: tab.position - 1}]});
            }
        });

        domTabTile.querySelector('.icon-column .js-movedown').addEventListener('click', e => {
            let tab = this.tabsSubject.getValue().find(t => t.id === tabId);
            let positions = this.tabsSubject.getValue().filter(t => t.display === activePanelTab).map(t => t.position);
            let maxPos = Math.max(...positions);

            if (tab.position < maxPos) {
                chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {position: tab.position + 1}]});
            }
        });

        if (!tab.flash) {
            domTabTile.querySelector('.js-flashicon').remove();
        }

        let domTabTitleContentTitleText = document.createTextNode(tabTitle);

        let domTabTileContentTitle = domTabTile.querySelector('.tile-title');
        domTabTileContentTitle.appendChild(domTabTitleContentTitleText);
        domTabTileContentTitle.setAttribute('title', tabTitle);

        let domTabTileContentSubtitle = domTabTile.querySelector('.tile-subtitle');
        domTabTileContentSubtitle.textContent = tabUrl;
        domTabTileContentSubtitle.setAttribute('title', tabUrl);

        domTabTile.querySelector('.js-param-button').addEventListener('click', e => {
            e.preventDefault();
            showTabTools(this.tabsSubject, tabId);
        });

        editableTextNode(domTabTileContentTitle, (oldValue, newValue) => {
            if (oldValue !== newValue) {
                chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {title: newValue}]});
            }
        });

        editableTextNode(domTabTileContentSubtitle, (oldValue, newValue) => {
            if (oldValue !== newValue) {
                chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {url: newValue}]});
            }
        });

        domPanelBody.appendChild(domTabTile);
    }

    getDisplayName(i) {
        return "Display " + i;
    }

    connect(e, callback) {
        logger.info("connection attempt");

        let serverUrlInput = document.querySelector('#serverUrl');
        let serverUrl = serverUrlInput.value;

        let connectionHint = document.querySelector('#connectionHint');

        chrome.storage.sync.set({
            server: serverUrl
        }, () => {

            NodeProxy.on('connectionSuccess', () => {
                logger.info("connectionSuccess");
                serverUrlInput.classList.remove('is-error');
                serverUrlInput.classList.add('is-success');
                document.querySelector('#parameters').removeAttribute('disabled');
                serverUrlInput.setAttribute('disabled', 'disabled');
                document.querySelector('#connect').textContent = "Disconnect";

                callback(true);
            });

            NodeProxy.on('connectionFailed', () => {
                logger.info("connectionFailed");
                connectionHint.textContent = "Connection failed";
                serverUrlInput.classList.remove('is-success');
                serverUrlInput.classList.add('is-error');
                callback(false);
            });

            NodeProxy.setServerUrl(serverUrl);
            NodeProxy.connect();

            serverUrlInput.classList.remove('is-success');
            serverUrlInput.classList.remove('is-error');
        });
    }

    disconnect(e, callback) {
        let serverUrlInput = document.querySelector('#serverUrl');
        serverUrlInput.removeAttribute('disabled');
        NodeProxy.close();

        let configOptions = Parameters.getParametersName();

        configOptions.forEach(configName => {
            document.querySelector('#' + configName).value = '';
        });

        document.querySelector('#parameters').setAttribute('disabled', 'disabled');
        document.querySelector('#connect').textContent = "Connect";
        callback(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let p = new Popup();
    p.boot();
});

