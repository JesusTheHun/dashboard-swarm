const reducer = (state = 0, action) => {
    switch (action.type) {
        case 'SET_ACTIVE_DISPLAY':
            return action.activeDisplay;
        default:
            return state;
    }
};

export default reducer;