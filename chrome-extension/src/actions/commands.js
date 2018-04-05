let types = {
    MASTER: 'MASTER',
    SERVER_URL: 'SERVER_URL',
    CONNECT: 'CONNECT',
    DISCONNECT: 'DISCONNECT',
    START_ROTATION: 'START_ROTATION',
    STOP_ROTATION: 'STOP_ROTATION',
    OPEN_TAB: 'OPEN_TAB',
    SEND_TAB_TO_FOREGROUND: 'SEND_TAB_TO_FOREGROUND',
    RELOAD_TAB: 'RELOAD_TAB',
    CLOSE_TAB: 'CLOSE_TAB',
    SEND_TAB_TO_DISPLAY: 'SEND_TAB_TO_DISPLAY',
    ZOOM_TAB: 'ZOOM_TAB',
    SCROLL_TAB: 'SCROLL_TAB',
    MOVE_TAB: 'MOVE_TAB',
    SET_TAB_TITLE: 'SET_TAB_TITLE',
    SET_TAB_URL: 'SET_TAB_URL',
    SET_TAB_AUTOREFRESH: 'SET_TAB_AUTOREFRESH',
    SERVER_CONFIG: 'SERVER_CONFIG',
};

const namespacedTypes = {};

Object.keys(types).forEach(type => {
    namespacedTypes[type] = 'API_COMMAND_' + type;
});

export const ApiCommandType = namespacedTypes;

let ApiCommand = {};

ApiCommand.MASTER = isMaster => ({
    type: ApiCommandType.MASTER,
    master: isMaster
});

ApiCommand.SERVER_URL = serverUrl => ({
    type: ApiCommandType.SERVER_URL,
    serverUrl
});

ApiCommand.CONNECT = () => ({
    type: ApiCommandType.CONNECT
});

ApiCommand.DISCONNECT = () => ({
    type: ApiCommandType.DISCONNECT
});

ApiCommand.START_ROTATION = () => ({
    type: ApiCommandType.START_ROTATION
});

ApiCommand.STOP_ROTATION = () => ({
    type: ApiCommandType.STOP_ROTATION
});

ApiCommand.OPEN_TAB = (display, url, isFlash) => ({
    type: ApiCommandType.OPEN_TAB,
    display,
    url,
    isFlash
});

ApiCommand.SEND_TAB_TO_FOREGROUND = id => ({
    type: ApiCommandType.SEND_TAB_TO_FOREGROUND,
    id
});

ApiCommand.RELOAD_TAB = id => ({
    type: ApiCommandType.RELOAD_TAB,
    id
});

ApiCommand.CLOSE_TAB = id => ({
    type: ApiCommandType.CLOSE_TAB,
    id
});

ApiCommand.SEND_TAB_TO_DISPLAY = (id, display) => ({
    type: ApiCommandType.SEND_TAB_TO_DISPLAY,
    id,
    display
});

ApiCommand.ZOOM_TAB = (id, zoom) => ({
    type: ApiCommandType.ZOOM_TAB,
    id,
    zoom
});

ApiCommand.SCROLL_TAB = (id, scroll) => ({
    type: ApiCommandType.SCROLL_TAB,
    id,
    scroll
});

ApiCommand.MOVE_TAB = (id, position) => ({
    type: ApiCommandType.MOVE_TAB,
    id,
    position
});

ApiCommand.SET_TAB_TITLE = (id, title) => ({
    type: ApiCommandType.SET_TAB_TITLE,
    id,
    title
});

ApiCommand.SET_TAB_URL = (id, url) => ({
    type: ApiCommandType.SET_TAB_URL,
    id,
    url
});

ApiCommand.SET_TAB_AUTOREFRESH = (id, autorefresh) => ({
    type: ApiCommandType.SET_TAB_AUTOREFRESH,
    id,
    autorefresh
});

ApiCommand.SERVER_CONFIG = (serverConfig) => ({
    type: ApiCommandType.SERVER_CONFIG,
    serverConfig
});

export {ApiCommand};