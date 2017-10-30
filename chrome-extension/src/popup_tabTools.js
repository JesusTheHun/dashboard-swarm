import DashboardSwarmWebSocket from "./classes/DashboardSwarmWebSocket";
import DashboardSwarmListener from "./classes/DashboardSwarmListener";
import Parameters from "./classes/Parameters";

document.addEventListener('DOMContentLoaded', () => {

    let tabTools = document.querySelector('#tabTools');
    let tabToolsClear = document.querySelector('#tabTools .modal-header .btn-clear');
// tabTools.style.marginTop = '1000px';
//
    tabToolsClear.addEventListener('click', (e) => {
        e.preventDefault();

        tabTools.style.marginTop = '1000px';
    });
});

function showTabTools(id) {
    let tabTools = document.querySelector('#tabTools');
    tabTools.style.marginTop = '0';
}

export default showTabTools;