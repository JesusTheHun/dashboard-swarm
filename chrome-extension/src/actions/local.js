const types = {
    ACTIVE_DISPLAY: 'ACTIVE_DISPLAY',
};

const namespacedTypes = {};

Object.keys(types).forEach(type => {
    namespacedTypes[type] = 'LOCAL_' + type;
});

export const ActionType = namespacedTypes;

let LocalAction = {};

LocalAction.ACTIVE_DISPLAY = activeDisplay => ({
    type: ActionType.ACTIVE_DISPLAY,
    activeDisplay
});

export {LocalAction};