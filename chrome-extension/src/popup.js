import defer from './function/defer';
import Rx from 'rxjs/Rx';

let getDisplays = new defer();
let activePanelTab = 0;

let tabsSubject = new Rx.BehaviorSubject([]);
let globalPlayerSubject = new Rx.BehaviorSubject(false);

chrome.runtime.onMessage.addListener(function(data) {
    if (data.target === 'popup' && data.action === 'getTabs') {
        tabsSubject.next(data.data);
    }

    if (data.target === 'popup' && data.action === 'getDisplays') {
        getDisplays.resolve(data.data);
    }

    if (data.target === 'popup' && data.action === 'tabOpened') {
        let currentTabs = tabsSubject.getValue();
        currentTabs.push(data.data);
        tabsSubject.next(currentTabs);
    }

    if (data.target === 'popup' && data.action === 'tabClosed') {
        let currentTabs = tabsSubject.getValue();
        let tabIdx = currentTabs.findIndex(tab => tab.id === data.data);
        currentTabs.splice(tabIdx, 1);
        tabsSubject.next(currentTabs);

        removeTabFromPanel(data.data);
    }

    if (data.target === 'popup' && data.action === 'tabUpdated') {
        let tabId = data.data[0];
        let newProps = data.data[1];
        let currentTabs = tabsSubject.getValue();
        let updatedTab = currentTabs.find(t => t.id === tabId);

        Object.assign(updatedTab, newProps);
        tabsSubject.next(currentTabs);
    }

    if (data.target === 'popup' && data.action === 'rotationStarted') {
        globalPlayerSubject.next(true);
    }

    if (data.target === 'popup' && data.action === 'rotationStopped') {
        globalPlayerSubject.next(false);
    }

});

chrome.runtime.sendMessage({node: "getDisplays"});
chrome.runtime.sendMessage({node: "getTabs"});

document.addEventListener('DOMContentLoaded', () => {

    let domPanelTabBlock = document.querySelector('#displays .panel ul.tab-block');

    getDisplays.then(displays => {
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


        domPanelTabBlock.querySelector('.tab-item:first-child a').dispatchEvent(new Event('click'));
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
            chrome.runtime.sendMessage({node: "stopRotation", args: []});
        } else {
            chrome.storage.sync.get({
                interval: 5000
            }, function(config) {
                chrome.runtime.sendMessage({node: "startRotation", args: [config.interval]});
            });
        }
    });

    globalPlayerSubject.subscribe(isPlaying => {
        let icon = document.getElementById('playPause').querySelector('i');
        icon.classList.remove('fa-play');
        icon.classList.remove('fa-pause');
        icon.classList.add(isPlaying === true ? 'fa-pause' : 'fa-play');
    });
});

function askOpenTab(isFlash) {
    if (isFlash === undefined) {
        isFlash = false;
    }

    console.log("Open tab in display #" + activePanelTab);
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

        displayTabs.map(tab => addTabToPanel(tab.id, tab.url, tab.title));
    });
}

function addTabToPanel(tabId, tabUrl, tabTitle) {

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

    let domTabTileDeleteButton = document.createElement('div');
    domTabTileDeleteButton.classList.add('btn', 'btn-link', 'btn-action', 'btn-lg');

    let domTabTileDeleteButtonIcon = document.createElement('i');
    domTabTileDeleteButtonIcon.classList.add('icon', 'icon-cross');

    let domTabTileForwardMenuButton = document.createElement('div');
    domTabTileForwardMenuButton.classList.add('btn', 'btn-link', 'btn-action', 'btn-lg');

    let DomTabTileForwardMenuButtonIcon = document.createElement('i');
    DomTabTileForwardMenuButtonIcon.classList.add('icon', 'icon-apps');

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

    domTabTileForwardMenuButton.appendChild(DomTabTileForwardMenuButtonIcon);
    domTabTileDeleteButton.appendChild(domTabTileDeleteButtonIcon);

    domTabTile.appendChild(domTabTileMoveIconsBox);
    domTabTile.appendChild(domTabTileContent);
    domTabTile.appendChild(domTabTileAction);
    domTabTileContent.appendChild(domTabTileContentTitle);
    domTabTileContent.appendChild(domTabTileContentSubtitle);

    domTabTileContentTitle.textContent = tabTitle;
    domTabTileContentTitle.setAttribute('title', tabTitle);
    domTabTileContentSubtitle.textContent = tabUrl;
    domTabTileContentSubtitle.setAttribute('title', tabUrl);

    domTabTileAction.appendChild(domTabTileForwardMenuButton);
    domTabTileAction.appendChild(domTabTileDeleteButton);
    domPanelBody.appendChild(domTabTile);

    let domTabTileForwardMenu = document.createElement('ul');
    domTabTileForwardMenu.classList.add('menu', 'hide');

    domPanelBody.insertBefore(domTabTileForwardMenu, domTabTile.nextSibling);

    domTabTileForwardMenuButton.addEventListener('click', e => {
        e.preventDefault();

        if (domTabTileForwardMenu.classList.contains('hide')) {
            domTabTileForwardMenu.classList.remove('hide');
        } else {
            domTabTileForwardMenu.classList.add('hide');
        }
    });

    getDisplays.then(displays => {
        for (let i in displays) {
            if (displays.hasOwnProperty(i) && parseInt(i) !== activePanelTab) {
                let domTabTileMenuElement = document.createElement('li');
                domTabTileMenuElement.classList.add('menu-item');

                let domTabTileMenuElementLink = document.createElement('a');
                domTabTileMenuElementLink.textContent = getDisplayName(i);

                domTabTileMenuElementLink.addEventListener('click', e => {
                    e.preventDefault();
                    chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {display: parseInt(i)}]});
                    domTabTileForwardMenu.classList.add('hide');
                });
                domTabTileMenuElementLink.setAttribute('href', 'javascript::');

                domTabTileMenuElement.appendChild(domTabTileMenuElementLink);
                domTabTileForwardMenu.appendChild(domTabTileMenuElement);
            }
        }
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

    domTabTileDeleteButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({node: "closeTab", args: [tabId]});
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