const types = {
    ACTIVE_TAB: 'ACTIVE_TAB',
};

const namespacedTypes = {};

Object.keys(types).forEach(type => {
    namespacedTypes[type] = 'BROWSER_' + type;
});

export const BrowserActionType = namespacedTypes;

let BrowserAction = {};

BrowserAction.ACTIVE_TAB = activeTab => ({
    type: BrowserActionType.ACTIVE_TAB,
    activeTab
});

export {BrowserAction};