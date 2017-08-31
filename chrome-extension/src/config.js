import DashboardSwarmNode from './classes/DashboardSwarmNode';

// Saves options to chrome.storage.sync.
function save_options() {
    let data = {
        master: document.getElementById('master').checked,
        server: document.getElementById('server').value
    };

    DashboardSwarmNode.setMaster(data.master);

    chrome.storage.sync.set(data, () => {
        let status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => status.textContent = '', 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        master: false,
        server: 'localhost:8080'
    }, function(items) {
        document.getElementById('master').checked = items.master;
        document.getElementById('server').value = items.server;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);