export const ApiEventType = {
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
    ACTIVE_DISPLAY: 'ACTIVE_DISPLAY',
};

let apiEvents = {};

apiEvents[ApiEventType.CONNECTED] = isConnected => ({
    type: ApiEventType.CONNECTED,
    connected: isConnected
});

apiEvents[ApiEventType.WAITING_CONNECTION] = isWaiting => ({
    type: ApiEventType.WAITING_CONNECTION,
    connecting: isWaiting
});

apiEvents[ApiEventType.WAITING_MASTER] = isWaiting => ({
    type: ApiEventType.WAITING_MASTER,
    waiting: isWaiting
});

apiEvents[ApiEventType.SERVER_CONFIG] = config => ({
    type: ApiEventType.SERVER_CONFIG,
    parameters: config
});

apiEvents[ApiEventType.DISPLAYS] = displays => ({
    type: ApiEventType.DISPLAYS,
    displays
});

apiEvents[ApiEventType.TABS_SET] = tabs => ({
    type: ApiEventType.TABS_SET,
    tabs
});

apiEvents[ApiEventType.TAB_ADDED] = tab => ({
    type: ApiEventType.TAB_ADDED,
    tab
});

apiEvents[ApiEventType.TAB_REMOVED] = id => ({
    type: ApiEventType.TAB_REMOVED,
    id
});

apiEvents[ApiEventType.TAB_UPDATED] = (id, props) => ({
    type: ApiEventType.TAB_UPDATED,
    id,
    props
});

apiEvents[ApiEventType.ROTATION_PLAYING] = playing => ({
    type: ApiEventType.ROTATION_PLAYING,
    playing
});

export const ApiEvent = apiEvents;