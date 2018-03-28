const reducer = (state = true, action) => {
    switch (action.type) {
        case 'ROTATION_PLAYING':
            return action.playing;
        default:
            return state;
    }
};

export default reducer;