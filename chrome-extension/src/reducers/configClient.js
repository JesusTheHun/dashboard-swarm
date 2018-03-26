let defaultConfig = {
    master: false,
    serverUrl: 'localhost:8080'
};

const reducer = (state = defaultConfig, action) => {
    switch (action.type) {
        case 'SET_SERVER_URL':
            return {
                ...state,
                serverUrl: action.serverUrl
            };

        case 'SET_MASTER':
            return {
                ...state,
                master: action.master
            };
        default:
            return state;
    }
};

export default reducer;