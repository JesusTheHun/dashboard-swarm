/**
 * TODO Need to clear this whole mess, make a proper stateful object
 */

import Rx from 'rxjs/Rx';
import nodeProxy from './channels/NodeProxy';

import { showTabTools } from './popup_tabTools';
import Logger from './logger';
import {Parameters} from "./classes/Parameters";

const logger = Logger.get('popup');
const NodeProxy = new nodeProxy();

let waitingMaster = null;
let activePanelTab = 0;

let tabsSubject = new Rx.BehaviorSubject([]);
let displaysSubject = new Rx.BehaviorSubject({});
let globalPlayerSubject = new Rx.BehaviorSubject(false);

function load() {
    logger.debug("load() called");
    clearTabsSpace();

    let masterTimeout = setTimeout(() => showWaitingMaster(), 500);

    NodeProxy.getDisplays(response => {
        logger.info("displays received, response from proxy : ", response);
        if (response !== null) {
            displaysSubject.next(response);
            clearTimeout(masterTimeout);
            removeWaitingMaster();
        }
    });

    NodeProxy.getTabs(response => {
        logger.info("tab received, response from proxy : ", response);
        tabsSubject.next(response);
    });
    NodeProxy.getRotationStatus();
}

load();

NodeProxy.on('connectionSuccess', () => {
    logger.info("new successful connection detected");
    load();
});

NodeProxy.on('connectionFailed', () => {
    logger.info("new connection attempt failed");
    load();
});

NodeProxy.on('rotationStatus', response => {
    globalPlayerSubject.next(response);
});
NodeProxy.on('rotationStarted', () => globalPlayerSubject.next(true));
NodeProxy.on('rotationStopped', () => globalPlayerSubject.next(false));

NodeProxy.on('tabOpened', tab => {
    let currentTabs = tabsSubject.getValue();
    currentTabs.push(tab);
    tabsSubject.next(currentTabs);
});

NodeProxy.on('tabClosed', tabId => {
    let currentTabs = tabsSubject.getValue();
    let tabIdx = currentTabs.findIndex(tab => tab.id === tabId);
    currentTabs.splice(tabIdx, 1);
    tabsSubject.next(currentTabs);

    removeTabFromPanel(tabId);
});

NodeProxy.on('tabUpdated', (tabId, newProps) => {
    let currentTabs = tabsSubject.getValue();

    if (!currentTabs) {
        logger.error("Whoops, empty tabs !");
        return;
    }

    let updatedTab = currentTabs.find(t => t.id === tabId);

    Object.assign(updatedTab, newProps);
    tabsSubject.next(currentTabs);
});

NodeProxy.on('getTabs', tabs => {
    logger.debug("Event `getTabs` received with : ", tabs);
    tabsSubject.next(tabs);
});

NodeProxy.on('getDisplays', displays => {
    logger.debug("Event `getDisplays` received with : ", displays);
    displaysSubject.next(displays);

    if (displays === null) {
        showWaitingMaster();
    } else {
        removeWaitingMaster();
    }
});

function clearTabsSpace() {
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

function showWaitingMaster() {
    if (waitingMaster) {
        return;
    }

    waitingMaster = document.getElementById('waitingMaster').cloneNode(true);
    waitingMaster.removeAttribute('id');
    waitingMaster.classList.remove('hide');
    document.querySelector('#displays .panel .panel-body').appendChild(waitingMaster);
}

function removeWaitingMaster() {
    if (!waitingMaster) {
        return;
    }

    waitingMaster.remove();
    waitingMaster = null;
}

document.addEventListener('DOMContentLoaded', () => {

    let domPanelTabBlock = document.querySelector('#displays .panel ul.tab-block');

    displaysSubject.subscribe(displays => {

        logger.debug("new displays, subscriber triggers : ", displays);

        clearTabsSpace();

        if (displays === null || Object.keys(displays).length === 0) {
            return;
        }

        for (let i in displays) {
            if (displays.hasOwnProperty(i)) {
                let domPanelTab = document.createElement('li');
                domPanelTab.classList.add('tab-item');

                let domPanelTabLink = document.createElement('a');
                domPanelTabLink.href = '#';
                domPanelTabLink.textContent = getDisplayName(i);

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
                    showTabsForDisplay(parseInt(i));
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
        askOpenTab(false);
    });

    document.getElementById('addDashboardFlash').addEventListener('click', () => {
        askOpenTab(true);
    });

    document.getElementById('dashboardUrl').addEventListener('keydown', (e) => {
        if (e.keyCode === 13) {
            askOpenTab(false);
        }
    });

    document.getElementById('playPause').addEventListener('click', () => {
        let isPlaying = globalPlayerSubject.getValue();

        if (isPlaying) {
            NodeProxy.stopRotation();
        } else {
            NodeProxy.startRotation();
        }
    });

    globalPlayerSubject.subscribe(isPlaying => {
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
            disconnect(e, response => {
                isConnected = response;
            });
        } else {
            connect(e, response => {
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
});

function askOpenTab(isFlash) {
    if (isFlash === undefined) {
        isFlash = false;
    }

    let dashboardUrl = document.getElementById('dashboardUrl').value;
    if (dashboardUrl !== "") {
        chrome.runtime.sendMessage({node: "openTab", args: [activePanelTab, dashboardUrl, isFlash]});
        document.getElementById('dashboardUrl').value = '';
    }
}

function showTabsForDisplay(display) {
    let domEmptyState = document.getElementById('empty');
    let domPanelBody = document.querySelector('#displays .panel .panel-body');

    tabsSubject.subscribe(tabs => {
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

        displayTabs.map(tab => addTabToPanel(tab));
    });
}

function addTabToPanel(tab) {
    let tabId = tab.id;
    let tabUrl = tab.url;
    let tabTitle = tab.title;

    let domPanelBody = document.querySelector('#displays .panel .panel-body');

    let domTabTile = document.querySelector('#tabTemplate').cloneNode(true);
    domTabTile.removeAttribute('id');
    domTabTile.setAttribute('data-tabId', tabId);

    domTabTile.querySelector('.icon-column .js-moveup').addEventListener('click', e => {
        let tab = tabsSubject.getValue().find(t => t.id === tabId);

        if (tab.position > 0) {
            chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {position: tab.position - 1}]});
        }
    });

    domTabTile.querySelector('.icon-column .js-movedown').addEventListener('click', e => {
        let tab = tabsSubject.getValue().find(t => t.id === tabId);
        let positions = tabsSubject.getValue().filter(t => t.display === activePanelTab).map(t => t.position);
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
        showTabTools(tabsSubject, tabId);
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

function editableTextNode(domElement, saveFunction) {

    let domParent = domElement.parentNode;

    domElement.addEventListener('click', () => {
        let previousDisplay = domElement.style.display;
        domElement.style.display = 'none';

        let input = document.createElement('input');

        let saveNewState = () => {
            if (typeof saveFunction === 'function') {
                saveFunction.call(undefined, domElement.textContent, input.value);
            }
            domElement.textContent = input.value;
            domElement.setAttribute('title', input.value);
            domElement.style.display = previousDisplay;
            domParent.removeChild(input);
        };

        input.setAttribute('type', 'text');
        input.classList.add('form-input');
        input.value = domElement.textContent;
        input.addEventListener('blur', saveNewState);
        input.addEventListener('keydown', (e) => {

            if (e.keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                input.removeEventListener('blur', saveNewState);
                saveNewState();
            }

            if (e.keyCode === 27) {
                e.preventDefault();
                e.stopPropagation();
                domParent.removeChild(input);
                domElement.style.display = previousDisplay;
            }
        });

        domParent.insertBefore(input, domElement);
        input.focus();
    });
}

function removeTabFromPanel(tabId) {

    let domPanelBody = document.querySelector('#displays .panel .panel-body');
    let domTabTiles = domPanelBody.querySelectorAll('.tile');

    if (domTabTiles.length > 0) {
        for (let i = 0; i < domTabTiles.length; i++) {
            let domTab = domTabTiles.item(i);
            let domTabId = domTab.getAttribute('data-tabId');

            if (domTabId === tabId) {
                domPanelBody.removeChild(domTab);
            }
        }
    }
}

function getDisplayName(i) {
    return "Display " + i;
}

function connect(e, callback) {
    logger.info("connection attempt");

    let serverUrlInput = document.querySelector('#serverUrl');
    let serverUrl = serverUrlInput.value;

    let connectionHint = document.querySelector('#connectionHint');

    chrome.storage.sync.set({
        server: serverUrl
    }, () => {

        NodeProxy.on('connectionSuccess', () => {
            logger.info("connectionSuccess");
            serverUrlInput.classList.add('is-success');
            document.querySelector('#parameters').removeAttribute('disabled');
            serverUrlInput.setAttribute('disabled', 'disabled');
            document.querySelector('#connect').textContent = "Disconnect";

            callback(true);
        });

        NodeProxy.on('connectionFailed', () => {
            logger.info("connectionFailed");
            connectionHint.textContent = "Connection failed";
            serverUrlInput.classList.add('is-error');
            callback(false);
        });

        NodeProxy.setServerUrl(serverUrl);
        NodeProxy.connect();

        serverUrlInput.classList.remove('is-success');
        serverUrlInput.classList.remove('is-error');
    });
}

function disconnect(e, callback) {
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