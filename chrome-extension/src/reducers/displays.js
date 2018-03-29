import {ApiEventType} from "../actions/events";

const reducer = (state = [], action) => {
    switch (action.type) {
        case ApiEventType.DISPLAYS:
            return action.displays;
        default:
            return state;
    }
};

export default reducer;