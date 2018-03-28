export const ApiCallType = {
    MASTER: 'MASTER',
};

let apiCalls = {};

apiCalls[ApiCallType.MASTER] = isConnected => ({
    type: ApiCallType.MASTER,
    connected: isConnected
});


export const ApiCall = apiCalls;