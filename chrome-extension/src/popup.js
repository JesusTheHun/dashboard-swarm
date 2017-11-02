import defer from './function/defer';
import Rx from 'rxjs/Rx';
import nodeProxy from './channels/NodeProxy';
import popupConfig from './popup_config';
import showTabTools from './popup_tabTools';

const NodeProxy = new nodeProxy();
let activePanelTab = 0;

let tabsSubject = new Rx.BehaviorSubject([]);
let displaysSubject = new Rx.BehaviorSubject({});
let globalPlayerSubject = new Rx.BehaviorSubject(false);

NodeProxy.getDisplays(response => displaysSubject.next(response));
NodeProxy.getTabs(response => tabsSubject.next(response));
NodeProxy.getRotationStatus();

NodeProxy.on('newConnection', () => {
    NodeProxy.getDisplays(response => displaysSubject.next(response));
    NodeProxy.getTabs(response => tabsSubject.next(response));
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
    let updatedTab = currentTabs.find(t => t.id === tabId);

    Object.assign(updatedTab, newProps);
    tabsSubject.next(currentTabs);
});

document.addEventListener('DOMContentLoaded', () => {

    let domPanelTabBlock = document.querySelector('#displays .panel ul.tab-block');

    displaysSubject.subscribe(displays => {
        while (domPanelTabBlock.firstChild) {
            domPanelTabBlock.removeChild(domPanelTabBlock.firstChild);
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

        let firstDisplay = domPanelTabBlock.querySelector('.tab-item:first-child a');

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

    let domTabTile = document.createElement('div');
    domTabTile.classList.add('tile');
    domTabTile.setAttribute('data-tabId', tabId);

    let domTabTileContent = document.createElement('div');
    domTabTileContent.classList.add('tile-content');

    let domTabTileContentTitle = document.createElement('div');
    domTabTileContentTitle.classList.add('tile-title');

    let domTabTileMoveIconsBox = document.createElement('div');
    domTabTileMoveIconsBox.classList.add('tile-action', 'icon-column');

    let domTabTileMoveUpIconWrapper = document.createElement('div');
    let domTabTileMoveUpIcon = document.createElement('i');
    domTabTileMoveUpIcon.classList.add('icon', 'icon-upward', 'hover-only');

    let domTabTileMoveDownIconWrapper = document.createElement('div');
    let domTabTileMoveDownIcon = document.createElement('i');
    domTabTileMoveDownIcon.classList.add('icon', 'icon-downward', 'hover-only');

    let domTabTileContentSubtitle = document.createElement('div');
    domTabTileContentSubtitle.classList.add('tile-subtitle');

    let domTabTileAction = document.createElement('div');
    domTabTileAction.classList.add('tile-action');

    let domTabTileParamMenuButton = document.createElement('div');
    domTabTileParamMenuButton.classList.add('btn', 'btn-link', 'btn-action', 'btn-lg');

    let DomTabTileParamMenuButtonIcon = document.createElement('i');
    DomTabTileParamMenuButtonIcon.classList.add('icon', 'icon-more-vert');

    domTabTileMoveUpIconWrapper.appendChild(domTabTileMoveUpIcon);
    domTabTileMoveDownIconWrapper.appendChild(domTabTileMoveDownIcon);

    domTabTileMoveUpIconWrapper.addEventListener('click', e => {
        let tab = tabsSubject.getValue().find(t => t.id === tabId);

        if (tab.position > 0) {
            chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {position: tab.position - 1}]});
        }
    });

    domTabTileMoveDownIconWrapper.addEventListener('click', e => {
        let tab = tabsSubject.getValue().find(t => t.id === tabId);
        let positions = tabsSubject.getValue().filter(t => t.display === activePanelTab).map(t => t.position);
        let maxPos = Math.max(...positions);

        if (tab.position < maxPos) {
            chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {position: tab.position + 1}]});
        }
    });

    domTabTileMoveIconsBox.appendChild(domTabTileMoveUpIconWrapper);
    domTabTileMoveIconsBox.appendChild(domTabTileMoveDownIconWrapper);

    domTabTileParamMenuButton.appendChild(DomTabTileParamMenuButtonIcon);

    domTabTile.appendChild(domTabTileMoveIconsBox);
    domTabTile.appendChild(domTabTileContent);
    domTabTile.appendChild(domTabTileAction);
    domTabTileContent.appendChild(domTabTileContentTitle);
    domTabTileContent.appendChild(domTabTileContentSubtitle);

    if (tab.flash) {
        let domTabTileFlashIcon = document.createElement('i');
        domTabTileFlashIcon.classList.add('fa');
        domTabTileFlashIcon.classList.add('fa-bolt');
        domTabTileFlashIcon.classList.add('watermark');
        domTabTileFlashIcon.classList.add('flashIcon');

        domTabTileContentTitle.appendChild(domTabTileFlashIcon);
    }

    let domTabTitleContentTitleText = document.createTextNode(tabTitle);

    domTabTileContentTitle.appendChild(domTabTitleContentTitleText);
    domTabTileContentTitle.setAttribute('title', tabTitle);
    domTabTileContentSubtitle.textContent = tabUrl;
    domTabTileContentSubtitle.setAttribute('title', tabUrl);

    domTabTileAction.appendChild(domTabTileParamMenuButton);
    domPanelBody.appendChild(domTabTile);

    let domTabTileParamMenu = document.createElement('ul');
    domTabTileParamMenu.classList.add('menu', 'hide');

    domPanelBody.insertBefore(domTabTileParamMenu, domTabTile.nextSibling);

    domTabTileParamMenuButton.addEventListener('click', e => {
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