export const ApiCommandType = {
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
};

let apiCommands = {};

apiCommands[ApiCommandType.MASTER] = isMaster => ({
    type: ApiCommandType.MASTER,
    master: isMaster
});

apiCommands[ApiCommandType.SERVER_URL] = serverUrl => ({
    type: ApiCommandType.SERVER_URL,
    serverUrl
});

apiCommands[ApiCommandType.CONNECT] = () => ({
    type: ApiCommandType.CONNECT
});

apiCommands[ApiCommandType.DISCONNECT] = () => ({
    type: ApiCommandType.DISCONNECT
});

apiCommands[ApiCommandType.START_ROTATION] = () => ({
    type: ApiCommandType.START_ROTATION
});

apiCommands[ApiCommandType.STOP_ROTATION] = () => ({
    type: ApiCommandType.STOP_ROTATION
});

apiCommands[ApiCommandType.OPEN_TAB] = (display, url, isFlash) => ({
    type: ApiCommandType.OPEN_TAB,
    display,
    url,
    isFlash
});

apiCommands[ApiCommandType.SEND_TAB_TO_FOREGROUND] = id => ({
    type: ApiCommandType.SEND_TAB_TO_FOREGROUND,
    id
});

apiCommands[ApiCommandType.RELOAD_TAB] = id => ({
    type: ApiCommandType.RELOAD_TAB,
    id
});

apiCommands[ApiCommandType.CLOSE_TAB] = id => ({
    type: ApiCommandType.CLOSE_TAB,
    id
});

apiCommands[ApiCommandType.SEND_TAB_TO_DISPLAY] = (id, display) => ({
    type: ApiCommandType.SEND_TAB_TO_DISPLAY,
    id,
    display
});

apiCommands[ApiCommandType.ZOOM_TAB] = (id, zoom) => ({
    type: ApiCommandType.ZOOM_TAB,
    id,
    zoom
});

apiCommands[ApiCommandType.SCROLL_TAB] = (id, scroll) => ({
    type: ApiCommandType.SCROLL_TAB,
    id,
    scroll
});


export const ApiCommand = apiCommands;