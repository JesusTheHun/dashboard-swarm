import {ApiCommandType} from "../actions/commands";

const reducer = (state = {}, action) => {
    switch (action.type) {
        case ApiCommandType.SERVER_URL:
            return {
                ...state,
                serverUrl: action.serverUrl
            };

        case ApiCommandType.MASTER:
            return {
                ...state,
                master: action.master
            };
        default:
            return state;
    }
};

export default reducer;