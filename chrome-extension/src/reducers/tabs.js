const reducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_TABS':
            return action.tabs;
        case 'ADD_TAB':
            return [
                ...state,
                action.tab
            ];
        case 'REMOVE_TAB':
            return state.filter(tab => tab.id === action.id);
        case 'UPDATE_TAB':
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