import React from "react";
import {ApiCommand} from "../actions/commands";

import Logger from "js-logger/src/logger";
import {connect} from "react-redux";

const logger = Logger.get('FooterComponent');

class FooterComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {dashboardUrl: ''}
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (!nextProps.browserActiveTab) {
            return null;
        }

        return {
            dashboardUrl: nextProps.browserActiveTab.url
        }
    }

    render() {
        return (
            <div className="panel-footer">
                <div className="input-group">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="New dashboard url"
                        id="dashboardUrl"
                        value={this.state.dashboardUrl}
                        onChange={ (e) => this.handleChange(e) }
                    />
                    <button className="btn btn-primary input-group-btn" id="addDashboard" onClick={ (e) => this.addTab(false) }>Add</button>
                    <button className="btn input-group-btn" id="addDashboardFlash" onClick={ (e) => this.addTab(true) }><i className="fa fa-bolt"/></button>
                </div>
            </div>
        )
    }

    addTab(isFlash) {
        this.props.dispatch(ApiCommand.OPEN_TAB(this.props.activeDisplay, this.state.dashboardUrl, isFlash));
    }

    handleChange(e) {
        this.setState({dashboardUrl: e.target.value});
    }
}

export const Footer = connect(store => {
    return { activeDisplay: store.activeDisplay, browserActiveTab: store.browser.activeTab }
})(FooterComponent);