import React from "react";
import {Player} from "./Player";
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
        return (
            <div className={'panel-body ' + (this.state.tabActionsOpen ? 'actionToolsOpen' : '')} ref={panel => this.panel = panel}>
                { this.state.tabActionsOpen ?
                    <TabActions closeTabActions={() => this.closeTabActions()} tab={this.props.tabs.find(tab => tab.id === this.state.tabId)} />
                    :
                    <React.Fragment>
                        <Player/>
                        <Displays/>
                        <Tabs openTabActions={(tabId) => this.openTabActions(tabId)} />
                    </React.Fragment>
                }
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