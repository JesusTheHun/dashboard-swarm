const reducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_DISPLAYS':
            return action.displays;
        default:
            return state;
    }
};

export default reducer;