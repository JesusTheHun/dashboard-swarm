import {ApiEventType} from "../actions/events";

const reducer = (state = [], action) => {
    switch (action.type) {
        case ApiEventType.TABS_SET:
            return action.tabs;
        case ApiEventType.TAB_ADDED:
            return [
                ...state,
                action.tab
            ];
        case ApiEventType.TAB_REMOVED:
            return state.filter(tab => tab.id === action.id);
        case ApiEventType.TAB_UPDATED:
            let tabIndex = state.findIndex(tab => tab.id === action.id);
            let tab = state.find(tab => tab.id === action.id);
            let updatedTab = Object.assign({}, tab, action.props);

            return [
                ...state.slice(0, tabIndex),
                updatedTab,
                ...state.slice(tabIndex+1)
            ];
        default:
            return state;
    }
};

export default reducer;