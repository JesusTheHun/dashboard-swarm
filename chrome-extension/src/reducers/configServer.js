const reducer = (state = {}, action) => {
    switch (action.type) {
        case 'SET_SERVER_PARAMETERS':
            return action.parameters;
        default:
            return state;
    }
};

export default reducer;