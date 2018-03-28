const reducer = (state = [], action) => {
    switch (action.type) {
        case 'DISPLAYS':
            return action.displays;
        default:
            return state;
    }
};

export default reducer;