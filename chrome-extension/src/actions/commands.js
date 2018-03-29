export const ApiCommandType = {
    MASTER: 'MASTER',
    SERVER_URL: 'SERVER_URL',
    CONNECT: 'CONNECT',
    DISCONNECT: 'DISCONNECT',
    START_ROTATION: 'START_ROTATION',
    STOP_ROTATION: 'STOP_ROTATION',
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


export const ApiCommand = apiCommands;