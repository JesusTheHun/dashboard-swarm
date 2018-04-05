import React from "react";
import {WaitingMaster} from "./WaitingMaster";
import {ControlCenter} from "./ControlCenter";
import {connect} from "react-redux";

class SceneComponent extends React.Component {

    render() {
        return (
            <div>
                {this.props.waitingMaster ? <WaitingMaster/> : <ControlCenter tabs={this.props.tabs} /> }
            </div>
        )
    }
}

export const Scene = connect(store => {
    return { waitingMaster: store.waitingMaster, tabs: store.tabs }
})(SceneComponent);