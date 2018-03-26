const reducer = (state = {connected: false, connecting: false}, action) => {
    switch (action.type) {
        case 'SET_CONNECTED':
            return {...state, connected: action.connected};
        case 'SET_WAITING_CONNECTION':
            return {...state, connecting: action.connecting};
        default:
            return state;
    }
};

export default reducer;