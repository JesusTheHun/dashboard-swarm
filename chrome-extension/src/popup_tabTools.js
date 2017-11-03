import DashboardSwarmWebSocket from "./classes/DashboardSwarmWebSocket";
import DashboardSwarmListener from "./classes/DashboardSwarmListener";
import Parameters from "./classes/Parameters";
import nodeProxy from "./channels/NodeProxy";
import defer from "./function/defer";

const NodeProxy = new nodeProxy();

function closeTabTools() {

    let tabTools = document.querySelector('#tabTools');
    tabTools.style.marginTop = '1000px';
    tabTools.classList.remove('active');
}

function showTabTools(tabsSubject, tabId) {
    let getDisplays = new defer();
    NodeProxy.getDisplays(response => getDisplays.resolve(response));

    let tab = tabsSubject.getValue().find(t => t.id === tabId);

    let tabTools = document.querySelector('#tabTools');
    tabTools.style.marginTop = '0';
    tabTools.classList.add('active');

    tabTools.parentNode.replaceChild(tabTools.cloneNode(true), tabTools);

    let tabToolsClear = document.querySelector('#tabTools #closePanel');
    let tabToolsModalOverlay = document.querySelector('#tabTools .modal-overlay');

    tabToolsClear.addEventListener('click', (e) => {
        e.preventDefault();
        closeTabTools();
    });
    tabToolsModalOverlay.addEventListener('click', (e) => {
        e.preventDefault();
        closeTabTools();
    });

    document.querySelector('#tabTools .modal-title').textContent = tab.title;

    document.querySelector('#tabTools #reload').addEventListener('click', (e) => {
        e.preventDefault();
        NodeProxy.reloadTab(tabId);
    });

    document.querySelector('#tabTools #foreground').addEventListener('click', (e) => {
        e.preventDefault();
        NodeProxy.sendToForeground(tabId);
    });

    document.querySelector('#tabTools #close').addEventListener('click', (e) => {
        e.preventDefault();
        NodeProxy.closeTab(tabId);
        closeTabTools();
    });

    let currentZoom = tab.zoom;
    let currentScroll = tab.scroll;

    tabsSubject.subscribe(tabs => {
        let tab = tabs.find(tab => tab.id === tabId);
        currentZoom = tab.zoom;

        // Legacy support
        if (tab.scroll === undefined) {
            tab.scroll = {top: 0, left: 0};
        }

        Object.assign(currentScroll, tab.scroll);
    });

    let zoomLabel = document.querySelector('#zoomLabel');

    tabsSubject.subscribe(tabs => {
        let updatedTab = tabs.find(tab => tab.id === tabId);
        zoomLabel.textContent = Math.round(updatedTab.zoom * 100) + " %";
    });

    document.querySelector('#zoomIn').addEventListener('click', () => {
        NodeProxy.updateTab(tabId, {zoom: currentZoom + 0.05});
    });

    document.querySelector('#zoomOut').addEventListener('click', () => {
        NodeProxy.updateTab(tabId, {zoom: currentZoom - 0.05});
    });

    let scroll = direction => {
        NodeProxy.updateTab(tabId, {scroll: direction});
    };

    document.querySelector('#scrollUp').addEventListener('click', () => scroll('top'));
    document.querySelector('#scrollDown').addEventListener('click', () => scroll('bottom'));
    document.querySelector('#scrollRight').addEventListener('click', () => scroll('right'));
    document.querySelector('#scrollLeft').addEventListener('click', () => scroll('left'));

    let domDisplays = document.querySelector('#tabTools .commands .displays');

    while (domDisplays.hasChildNodes()) {
        domDisplays.removeChild(domDisplays.firstChild);
    }

    getDisplays.then(displays => {
        for (let i in displays) {
            let btn = document.createElement('button');
            btn.classList.add('btn');
            btn.textContent = i;

            if (tab.display === i) {
                btn.classList.add('disabled');
            }

            btn.addEventListener('click', (e) => {
                NodeProxy.updateTab(tabId, {display: parseInt(i)});
            });

            domDisplays.appendChild(btn);
        }
    });
}

export default showTabTools;