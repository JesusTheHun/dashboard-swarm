import React from "react";
import {WaitingMaster} from "./WaitingMaster";
import {ControlCenter} from "./ControlCenter";

export class Scene extends React.Component {

    render() {
        return (
            <div>
                {this.props.waitingMaster ? <WaitingMaster/> : <ControlCenter tabs={this.props.tabs} /> }
            </div>
        )
    }
}