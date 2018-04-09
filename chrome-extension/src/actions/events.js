export const types = {
    CONNECTED: 'CONNECTED',
    WAITING_CONNECTION: 'WAITING_CONNECTION',
    WAITING_MASTER: 'WAITING_MASTER',
    SERVER_CONFIG: 'SERVER_CONFIG',
    DISPLAYS: 'DISPLAYS',
    TABS_SET: 'TABS_SET',
    TAB_ADDED: 'TAB_ADDED',
    TAB_REMOVED: 'TAB_REMOVED',
    TAB_UPDATED: 'TAB_UPDATED',
    ROTATION_PLAYING: 'ROTATION_PLAYING',
};

const namespacedTypes = {};

Object.keys(types).forEach(type => {
    namespacedTypes[type] = 'API_EVENT_' + type;
});

export const ApiEventType = namespacedTypes;

let ApiEvent = {};

ApiEvent.CONNECTED = isConnected => ({
    type: ApiEventType.CONNECTED,
    connected: isConnected
});

ApiEvent.WAITING_CONNECTION = isWaiting => ({
    type: ApiEventType.WAITING_CONNECTION,
    connecting: isWaiting
});

ApiEvent.WAITING_MASTER = isWaiting => ({
    type: ApiEventType.WAITING_MASTER,
    waiting: isWaiting
});

ApiEvent.SERVER_CONFIG = config => ({
    type: ApiEventType.SERVER_CONFIG,
    configServer: config
});

ApiEvent.DISPLAYS = displays => ({
    type: ApiEventType.DISPLAYS,
    displays
});

ApiEvent.TABS_SET = tabs => ({
    type: ApiEventType.TABS_SET,
    tabs
});

ApiEvent.TAB_ADDED = tab => ({
    type: ApiEventType.TAB_ADDED,
    tab
});

ApiEvent.TAB_REMOVED = id => ({
    type: ApiEventType.TAB_REMOVED,
    id
});

ApiEvent.TAB_UPDATED = (id, props) => ({
    type: ApiEventType.TAB_UPDATED,
    id,
    props
});

ApiEvent.ROTATION_PLAYING = playing => ({
    type: ApiEventType.ROTATION_PLAYING,
    playing
});

export {ApiEvent};