document.addEventListener('DOMContentLoaded', function() {
    let status = document.getElementById("status");

    status.textContent = "LOADED";

    document.getElementById("addTab").addEventListener('click', function(){
        status.textContent = "addTab CLICKED";
        chrome.runtime.sendMessage({ds: "addTab"});
    });

    document.getElementById("createWindows").addEventListener('click', function(){
        status.textContent = "LOAD CLICKED";
        chrome.runtime.sendMessage({wm: "createWindows"});
    });

    document.getElementById("closeWindows").addEventListener('click', function() {
        status.textContent = "CLOSE CLICKED";
        chrome.runtime.sendMessage({wm: "closeEverything"});
    });

    document.getElementById("debug").addEventListener('click', function(){
        status.textContent = "DEBUG CLICKED";
        chrome.runtime.sendMessage({wm: "showInternalVariables"});
    });

    document.getElementById("config").addEventListener('click', function(){
        status.textContent = "CONFIG CLICKED";
        chrome.windows.getCurrent(false, ["normal"]);
    });
});
