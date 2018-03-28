const reducer = (state = {}, action) => {
    switch (action.type) {
        case 'SERVER_PARAMETERS':
            return action.parameters;
        default:
            return state;
    }
};

export default reducer;