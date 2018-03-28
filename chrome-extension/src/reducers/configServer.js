import {ApiEventType} from "../actions/events";

const reducer = (state = {}, action) => {
    switch (action.type) {
        case ApiEventType.SERVER_CONFIG:
            return action.parameters;
        default:
            return state;
    }
};

export default reducer;