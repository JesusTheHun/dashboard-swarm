import { DashboardSwarmNode } from './classes/DashboardSwarmNode';
import { DashboardSwarmWebSocket } from './classes/DashboardSwarmWebSocket';
import { DashboardSwarmListener } from './classes/DashboardSwarmListener';
import { WindowsManager } from './classes/WindowsManager';
import { Parameters } from './classes/Parameters';

function boot() {}

if (boot.ws === undefined) boot.ws = new DashboardSwarmWebSocket();
if (boot.listener === undefined) boot.listener = new DashboardSwarmListener(boot.ws);
if (boot.param === undefined) boot.param =  new Parameters(boot.listener);
if (boot.node === undefined) boot.node = new DashboardSwarmNode(boot.ws);
if (boot.wm === undefined) boot.wm =  new WindowsManager(boot.listener, boot.node);

let node = boot.node;
let ws = boot.ws;
let wm = boot.wm;
let param = boot.param;
let listener = boot.listener;

export {
    node as dashboardSwarmNode,
    ws as dashboardSwarmWebSocket,
    wm as dashboardSwarmWindowsManager,
    param as dashboardSwarmParameters,
    listener as dashboardSwarmListener,
};