const reducer = (state = {connected: false, connecting: false}, action) => {
    switch (action.type) {
        case 'CONNECTED':
            return {...state, connected: action.connected};
        case 'WAITING_CONNECTION':
            return {...state, connecting: action.connecting};
        default:
            return state;
    }
};

export default reducer;