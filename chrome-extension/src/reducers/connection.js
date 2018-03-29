import {ApiEventType} from "../actions/events";

const reducer = (state = {connected: false, connecting: false}, action) => {
    switch (action.type) {
        case ApiEventType.CONNECTED:
            return {...state, connected: action.connected};
        case ApiEventType.WAITING_CONNECTION:
            return {...state, connecting: action.connecting};
        default:
            return state;
    }
};

export default reducer;