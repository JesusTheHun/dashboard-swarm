import DashboardSwarmWebSocket from "./classes/DashboardSwarmWebSocket";

(() => {

    document.addEventListener('DOMContentLoaded', () => {

        let configLink = document.querySelector('#configLink');
        configLink.addEventListener('click', e => {
            e.preventDefault();

            document.querySelector('div#displays').style.display = 'none';
            document.querySelector('div#config').style.display = 'block';
        });

        configLink.click();

        let closeConfigLink = document.querySelector('#closeConfigLink');

        closeConfigLink.addEventListener('click', e => {
            e.preventDefault();

            document.querySelector('div#displays').style.display = 'block';
            document.querySelector('div#config').style.display = 'none';
        });

        let parameters = document.querySelector('#parameters');
        parameters.setAttribute('disabled', 'disabled');

        document.querySelector('#master').addEventListener('change', e => {
            chrome.storage.sync.set({
                master: e.target.checked
            });
        });

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
                });
            }
        });
    });


})();

function connect(e, callback) {
    let serverUrlInput = document.querySelector('#serverUrl');
    let serverUrl = serverUrlInput.value;

    let connectionHint = document.querySelector('#connectionHint');

    chrome.storage.sync.set({
        server: serverUrl
    }, () => {
        DashboardSwarmWebSocket.setServerUrl(serverUrl);
        DashboardSwarmWebSocket.connect();

        serverUrlInput.classList.remove('is-success');
        serverUrlInput.classList.remove('is-error');

        DashboardSwarmWebSocket.getWebSocketReady().then(() => {

            serverUrlInput.classList.add('is-success');
            document.querySelector('#parameters').removeAttribute('disabled');
            serverUrlInput.setAttribute('disabled', 'disabled');
            document.querySelector('#connect').textContent = "Disconnect";
            callback(true);

        }).catch(err => {
            connectionHint.textContent = "Error : " + err;
            serverUrlInput.classList.add('is-error');
            callback(false);
        });
    });
}

function disconnect(e, callback) {
    let serverUrlInput = document.querySelector('#serverUrl');
    serverUrlInput.removeAttribute('disabled');
    DashboardSwarmWebSocket.close();
    document.querySelector('#parameters').setAttribute('disabled', 'disabled');
    callback(false);
}

export default {};