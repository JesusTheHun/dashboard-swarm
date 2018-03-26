import React from "react";
import {Player} from "./Player";
import {connect} from "react-redux";
import {Displays} from "./Displays";
import {Tabs} from "./Tabs";

export class ControlCenter extends React.Component {
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

        return (
            <div className="panel-body">
                <LivePlayer/>
                <LiveDisplayList/>
                <LiveTabs />
            </div>
        )
    }
}