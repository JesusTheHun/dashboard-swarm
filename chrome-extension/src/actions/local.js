export const ActionType = {
    ACTIVE_DISPLAY: 'ACTIVE_DISPLAY',
};

let localActions = {};

localActions[ActionType.ACTIVE_DISPLAY] = activeDisplay => ({
    type: ActionType.ACTIVE_DISPLAY,
    activeDisplay
});

export const LocalAction = localActions;