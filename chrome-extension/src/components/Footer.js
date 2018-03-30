import React from "react";
import {ApiCommand} from "../actions/commands";

import Logger from "js-logger/src/logger";

const logger = Logger.get('FooterComponent');

export class Footer extends React.Component {
    render() {
        return (
            <div className="panel-footer">
                <div className="input-group">
                    <input type="text" className="form-input" placeholder="New dashboard url" id="dashboardUrl" ref={node => this.tabUrlInput = node} />
                    <button className="btn btn-primary input-group-btn" id="addDashboard" onClick={ (e) => this.addTab(false) }>Add</button>
                    <button className="btn input-group-btn" id="addDashboardFlash" onClick={ (e) => this.addTab(true) }><i className="fa fa-bolt"/></button>
                </div>
            </div>
        )
    }

    addTab(isFlash) {
        this.props.dispatch(ApiCommand.OPEN_TAB(this.props.activeDisplay, this.tabUrlInput.value, isFlash));
    }
}