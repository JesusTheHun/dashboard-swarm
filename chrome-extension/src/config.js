// Saves options to chrome.storage.sync.
function save_options() {
    let data = {
        master: document.getElementById('master').checked,
        server: document.getElementById('master').value
    };

    DashboardSwarm.setMaster(data.master);

    chrome.storage.sync.set(data);
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        master: 0,
        server: 'localhost:8080'
    }, function(items) {
        document.getElementById('master').checked = items.master;
        document.getElementById('server').value = items.server;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('master').addEventListener('click', save_options);
document.getElementById('server').addEventListener('change', save_options);