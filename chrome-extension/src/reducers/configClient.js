const reducer = (state = {}, action) => {
    switch (action.type) {
        case 'SERVER_URL':
            return {
                ...state,
                serverUrl: action.serverUrl
            };

        case 'MASTER':
            return {
                ...state,
                master: action.master
            };
        default:
            return state;
    }
};

export default reducer;