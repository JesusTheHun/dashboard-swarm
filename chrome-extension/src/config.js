import DashboardSwarmNode from './classes/DashboardSwarmNode';
import DashboardSwarmWebSocket from './classes/DashboardSwarmWebSocket';
import DashboardSwarmListener from './classes/DashboardSwarmListener';

// Saves options to chrome.storage.sync.
function save_options() {



    chrome.storage.sync.get({
        master: false,
        server: 'localhost:8080',
        interval: 5000
    }, function(previousConfig) {

        let data = {
            master: document.getElementById('master').checked,
            server: document.getElementById('server').value,
            interval: document.getElementById('interval').value
        };

        DashboardSwarmNode.setMaster(data.master);

        chrome.storage.sync.set(data, () => {
            let status = document.getElementById('status');

            // Reboot rotation to use new interval
            if (previousConfig.interval !== data.interval) {
                chrome.runtime.sendMessage({node: "stopRotation", args: []});
                chrome.runtime.sendMessage({node: "startRotation", args: [data.interval]});
            }

            status.textContent = 'Options saved.';
            setTimeout(() => status.textContent = '', 750);
        });
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {

    chrome.storage.sync.get({
        master: false,
        server: 'localhost:8080'
    }, function(items) {
        document.getElementById('server').value = items.server;
        document.getElementById('master').checked = items.master;

        DashboardSwarmWebSocket.setServerUrl(items.server);
        DashboardSwarmWebSocket.connect();

        DashboardSwarmListener.subscribeEvent('serverConfig', config => {
            console.log(config);
        });

        DashboardSwarmWebSocket.sendCommand('getConfig');
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);