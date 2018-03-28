import React from "react";

import Logger from "js-logger/src/logger";

const logger = Logger.get('ConfigMasterComponent');

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
        this.props.dispatch({
            type: 'MASTER',
            master: isMaster
        });
    }
}