import defer from './function/defer';

let getTabs = new defer();
let getDisplays = new defer();

chrome.runtime.onMessage.addListener(function(data) {
    if (data.target === 'popup' && data.action === 'getTabs') {
        getTabs.resolve(data.data);
    }

    if (data.target === 'popup' && data.action === 'getDisplays') {
        getDisplays.resolve(data.data);
    }
});

chrome.runtime.sendMessage({node: "getTabs"});
chrome.runtime.sendMessage({node: "getDisplays"});

document.addEventListener('DOMContentLoaded', () => {
    let domPanelTabBlock = document.querySelector('#screens .panel ul.tab-block');

    getDisplays.then(displays => {
        for (let i in displays) {
            if (displays.hasOwnProperty(i)) {
                let domPanelTab = document.createElement('li');
                domPanelTab.classList.add('tab-item');

                let domPanelTabLink = document.createElement('a');
                domPanelTabLink.href = '#';
                domPanelTabLink.textContent = "Screen " + i;

                domPanelTab.appendChild(domPanelTabLink);
                domPanelTabBlock.appendChild(domPanelTab);

                domPanelTabLink.addEventListener('click', () => {
                    showTabsForScreen(parseInt(i));
                });
            }
        }
    });
});

function showTabsForScreen(screen) {

    let domEmptyState = document.getElementById('empty');
    let domPanelBody = document.querySelector('#screens .panel .panel-body');

    getTabs.then(tabs => {
        // Clear previous content
        while (domPanelBody.firstChild) {
            domPanelBody.removeChild(domPanelBody.firstChild);
        }

        // Assemble new content
        let screenTabs = tabs.filter(tab => tab.screen === screen);

        if (screenTabs.length === 0) {
            let domEmptyStateClone = domEmptyState.cloneNode(true);
            domEmptyStateClone.removeAttribute('id');
            domPanelBody.appendChild(domEmptyStateClone);
            return;
        }

        screenTabs.map(tab => {

            let domTabTile = document.createElement('div');
            domTabTile.classList.add('tile', 'tile-centered');

            let domTabTileContent = document.createElement('div');
            domTabTileContent.classList.add('tile-content');

            let domTabTileContentTitle = document.createElement('div');
            domTabTileContentTitle.classList.add('tile-title');

            let domTabTileContentSubtitle = document.createElement('div');
            domTabTileContentSubtitle.classList.add('tile-subtitle');

            let domTabTileAction = document.createElement('div');
            domTabTileAction.classList.add('tile-action');

            let domTabTileActionButton = document.createElement('button');
            domTabTileActionButton.classList.add('btn', 'btn-link', 'btn-action', 'btn-lg');

            let domTabTileActionButtonIcon = document.createElement('i');
            domTabTileActionButtonIcon.classList.add('icon', 'icon-edit');

            domTabTile.appendChild(domTabTileContent);
            domTabTile.appendChild(domTabTileAction);
            domTabTileContent.appendChild(domTabTileContentTitle);
            domTabTileContent.appendChild(domTabTileContentSubtitle);
            domTabTileAction.appendChild(domTabTileActionButton);
            domTabTileActionButton.appendChild(domTabTileActionButtonIcon);

            domTabTileContentTitle.textContent = "Foo";
            domTabTileContentSubtitle.textContent = tab.url;


            domPanelBody.appendChild(domTabTile);
        });
    });
}