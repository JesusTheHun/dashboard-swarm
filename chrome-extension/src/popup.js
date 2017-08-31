document.addEventListener('DOMContentLoaded', function() {

    let status = document.getElementById("status");
    status.textContent = "LOADED";

    document.getElementById("identify").addEventListener('click', function(){
       status.textContent = "IDENTIFY CLICKED";
       chrome.runtime.sendMessage({wm: "identifyDisplays"});
    });
});
