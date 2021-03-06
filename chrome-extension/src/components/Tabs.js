import React from "react";
import {Tab} from "./Tab";
import {connect} from "react-redux";

class TabsComponent extends React.Component {
    render() {
        return (
            <React.Fragment>
            { this.props.tabs.length > 0 ?
                <ul id="tabs">
                    {this.props.tabs.sort((a,b) => a.position - b.position).map(tab => {
                        return <Tab
                            openTabActions={() => this.props.openTabActions(tab.id)}
                            key={tab.id}
                            {...tab}
                        />
                    })}
                </ul>
                :
                <div id="empty" className="empty">
                    <p className="empty-title h5">You have no dashboard on this display</p>
                    <p className="empty-subtitle">Enter an URL below to add one.</p>
                </div>
            }
            </React.Fragment>
        )
    }
}

const getVisibleTabs = (tabs, displayId) => tabs.filter(tab => tab.display === displayId);

export const Tabs = connect(store => {
    return { tabs: getVisibleTabs(store.tabs, store.activeDisplay) };
})(TabsComponent);