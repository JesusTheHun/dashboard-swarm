import {BrowserActionType} from "../actions/browser";

const reducer = (state = {}, action) => {
    switch (action.type) {
        case BrowserActionType.ACTIVE_TAB:
            return {...state, activeTab: action.activeTab};
        default:
            return state;
    }
};

export default reducer;