export const BrowserActionType = {
    ACTIVE_TAB: 'ACTIVE_TAB',
};

let browserActions = {};

browserActions[BrowserActionType.ACTIVE_TAB] = activeTab => ({
    type: BrowserActionType.ACTIVE_TAB,
    activeTab
});

export const BrowserAction = browserActions;