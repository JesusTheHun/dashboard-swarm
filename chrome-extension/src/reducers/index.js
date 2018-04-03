import { combineReducers } from 'redux';
import activeDisplay from "./activeDisplay";
import displays from "./displays";
import tabs from './tabs';
import waitingMaster from "./waitingMaster";
import rotationPlaying from "./rotationPlaying";
import configClient from "./configClient";
import configServer from "./configServer";
import connection from "./connection";
import browser from "./browser";

const app = combineReducers({
    activeDisplay,
    displays,
    tabs,
    waitingMaster,
    rotationPlaying,
    configClient,
    configServer,
    connection,
    browser,
});

export default app;