import React from "react";
import {ApiCommand} from "../actions/commands";

export class ConfigMaster extends React.Component {
    render() {
        return (
            <fieldset id="client">
                <div className="form-group">
                    <label className="form-switch">
                        <input id="master" type="checkbox" onChange={ (e) => this.setMaster(e.target.checked) } checked={this.props.configClient.master ? "checked" : ""} /> <i className="form-icon"/> Display dashboards on this computer
                    </label>
                </div>
            </fieldset>
        );
    }

    setMaster(isMaster) {
        this.props.dispatch(ApiCommand.MASTER(isMaster));
    }
}