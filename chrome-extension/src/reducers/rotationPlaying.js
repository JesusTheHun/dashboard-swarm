import {ApiEventType} from "../actions/events";

const reducer = (state = true, action) => {
    switch (action.type) {
        case ApiEventType.ROTATION_PLAYING:
            return action.playing;
        default:
            return state;
    }
};

export default reducer;