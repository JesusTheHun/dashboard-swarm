const reducer = (state = true, action) => {
    switch (action.type) {
        case 'SET_WAITING_MASTER':
            return action.waiting;
        default:
            return state;
    }
};

export default reducer;