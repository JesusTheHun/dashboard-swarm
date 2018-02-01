import {Parameters} from "./classes/Parameters";
import nodeProxy from "./channels/NodeProxy";

const NodeProxy = new nodeProxy();

document.addEventListener('DOMContentLoaded', () => {

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

function connect(e, callback) {
    let serverUrlInput = document.querySelector('#serverUrl');
    let serverUrl = serverUrlInput.value;

    let connectionHint = document.querySelector('#connectionHint');

    chrome.storage.sync.set({
        server: serverUrl
    }, () => {

        NodeProxy.on('connectionSuccess', () => {
            serverUrlInput.classList.add('is-success');
            document.querySelector('#parameters').removeAttribute('disabled');
            serverUrlInput.setAttribute('disabled', 'disabled');
            document.querySelector('#connect').textContent = "Disconnect";

            NodeProxy.refresh();

            callback(true);
        });

        NodeProxy.on('connectionFailed', () => {
            connectionHint.textContent = "Error : " + err;
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

export default {};