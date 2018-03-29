import {ApiEventType} from "../actions/events";

const reducer = (state = true, action) => {
    switch (action.type) {
        case ApiEventType.WAITING_MASTER:
            return action.waiting;
        default:
            return state;
    }
};

export default reducer;