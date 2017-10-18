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

    if (data.target === 'popup' && data.action === 'rotationStatus') {
        globalPlayerSubject.next(data.data);
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
chrome.runtime.sendMessage({node: "getRotationStatus"});

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

        console.log(isPlaying);

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
        console.log(isPlaying);
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

    domTabTileContentTitle.textContent = tabTitle;
    domTabTileContentTitle.setAttribute('title', tabTitle);
    domTabTileContentSubtitle.textContent = tabUrl;
    domTabTileContentSubtitle.setAttribute('title', tabUrl);

    domTabTileAction.appendChild(domTabTileParamMenuButton);
    domPanelBody.appendChild(domTabTile);

    let domTabTileParamMenu = document.createElement('ul');
    domTabTileParamMenu.classList.add('menu', 'hide');

    domPanelBody.insertBefore(domTabTileParamMenu, domTabTile.nextSibling);

    let body = document.querySelector('body');
    let bodyOriginalHeight = body.offsetHeight;

    domTabTileParamMenuButton.addEventListener('click', e => {
        e.preventDefault();

        let bodyHeight = body.offsetHeight;

        if (domTabTileParamMenu.classList.contains('hide')) {
            domTabTileParamMenu.classList.remove('hide');

            let menuBottom = domTabTileParamMenu.offsetTop + domTabTileParamMenu.offsetHeight;

            if (menuBottom > bodyHeight) {
                body.style.height = (menuBottom + 10) + 'px';
            }

        } else {
            domTabTileParamMenu.classList.add('hide');
            body.style.height = bodyOriginalHeight + 'px';
        }
    });

    getDisplays.then(displays => {

        let domTabTileReloadLink = createMenuElement("Reload", e => {
            e.preventDefault();
            chrome.runtime.sendMessage({node: "reloadTab", args: [tabId]});
        });

        domTabTileParamMenu.appendChild(domTabTileReloadLink);

        let currentZoom = 1.00;

        tabsSubject.subscribe(tabs => {
            let tab = tabs.find(tab => tab.id === tabId);
            currentZoom = tab.zoom;
        });

        let zoomDividerText = zoom => "ZOOM - " + parseInt(zoom * 100) + " %";

        let domTabTileZoomDivider = createMenuDivider(zoomDividerText(currentZoom));
        domTabTileParamMenu.appendChild(domTabTileZoomDivider);

        tabsSubject.subscribe(tabs => {
            let tab = tabs.find(tab => tab.id === tabId);
            domTabTileZoomDivider.setAttribute('data-content', zoomDividerText(tab.zoom));
        });

        let domTabTileZoomInLink = createMenuElement("Zoom In", e => {
            e.preventDefault();
            chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {zoom: currentZoom + 0.05}]});
        });

        domTabTileParamMenu.appendChild(domTabTileZoomInLink);

        let domTabTileZoomOutLink = createMenuElement("Zoom Out", e => {
            e.preventDefault();
            chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {zoom: currentZoom - 0.05}]});
        });

        domTabTileParamMenu.appendChild(domTabTileZoomOutLink);

        let domTabTileZoomResetLink = createMenuElement("Zoom Reset", e => {
            e.preventDefault();
            chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {zoom: 1}]});
        });

        domTabTileParamMenu.appendChild(domTabTileZoomResetLink);

        let domTabTileDisplayDivider = createMenuDivider("SEND TO DISPLAY");
        domTabTileParamMenu.appendChild(domTabTileDisplayDivider);

        for (let i in displays) {
            if (displays.hasOwnProperty(i) && parseInt(i) !== activePanelTab) {
                let displayLink = createMenuElement(getDisplayName(i), e => {
                    e.preventDefault();
                    chrome.runtime.sendMessage({node: "updateTab", args: [tabId, {display: parseInt(i)}]});
                    domTabTileParamMenu.classList.add('hide');
                });

                domTabTileParamMenu.appendChild(displayLink);
            }
        }


        let domTabTileCarefulDivider = createMenuDivider("CAREFUL");
        domTabTileParamMenu.appendChild(domTabTileCarefulDivider);

        let domTabTileDeleteLink = createMenuElement("Supprimer", e => {
            e.preventDefault();
            chrome.runtime.sendMessage({node: "closeTab", args: [tabId]});
            domTabTileParamMenu.classList.add('hide');
        });

        domTabTileParamMenu.appendChild(domTabTileDeleteLink);
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

function createMenuElement(text, clickCallback) {
    let domTabTileMenuElement = document.createElement('li');
    domTabTileMenuElement.classList.add('menu-item');

    let domTabTileMenuElementLink = document.createElement('a');
    domTabTileMenuElementLink.textContent = text;

    domTabTileMenuElementLink.addEventListener('click', clickCallback);
    domTabTileMenuElementLink.setAttribute('href', 'javascript::');

    domTabTileMenuElement.appendChild(domTabTileMenuElementLink);

    return domTabTileMenuElement;
}

function createMenuDivider(text) {
    let domTabTileMenuElement = document.createElement('li');
    domTabTileMenuElement.classList.add('divider');
    domTabTileMenuElement.setAttribute('data-content', text);

    return domTabTileMenuElement;
}