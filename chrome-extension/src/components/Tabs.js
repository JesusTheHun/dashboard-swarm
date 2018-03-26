import React from "react";
import {Tab} from "./Tab";

export class Tabs extends React.Component {

    render() {
        return (
            <React.Fragment>
            { this.props.tabs.length > 0 ?
                <ul id="tabs">
                    {this.props.tabs.map(tab => {
                        return <Tab key={tab.id} {...tab} />
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