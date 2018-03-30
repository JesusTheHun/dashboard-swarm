import React from "react";
import {Player} from "./Player";
import {connect} from "react-redux";
import {Displays} from "./Displays";
import {Tabs} from "./Tabs";
import {TabActions} from "./TabActions";
import Logger from "js-logger/src/logger";

const logger = Logger.get('ControlCenterComponent');

export class ControlCenter extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tabActionsOpen: false
        };
    }

    render() {
        const LivePlayer = connect(store => {
            return { playing: store.rotationPlaying }
        })(Player);

        const LiveDisplayList = connect(store => {
            return { displays: store.displays, activeDisplay: store.activeDisplay }
        })(Displays);

        const getVisibleTabs = (tabs, displayId) => tabs.filter(tab => tab.display === displayId);

        const LiveTabs = connect(store => {
            return { tabs: getVisibleTabs(store.tabs, store.activeDisplay) };
        })(Tabs);

        const LiveTabActions = connect(store => {
            return { displays: store.displays };
        })(TabActions);

        return (
            <div className="panel-body">
                <LivePlayer/>
                <LiveDisplayList/>
                <LiveTabs openTabActions={(tabId) => this.openTabActions(tabId)} />
                { this.state.tabActionsOpen ? <LiveTabActions closeTabActions={() => this.closeTabActions()} tab={this.props.tabs.find(tab => tab.id === this.state.tabId)} /> : ''}
            </div>
        )
    }

    openTabActions(tabId) {
        this.setState({ tabActionsOpen: true, tabId }, () => logger.debug("tab actions toggled", tabId));
    }

    closeTabActions() {
        this.setState({ tabActionsOpen: false });
    }
}