import React from "react";
import nodeProxy from "../channels/NodeProxy";
import Logger from "js-logger/src/logger";

const NodeProxy = new nodeProxy();
const logger = Logger.get('configServerUrl');

export class ConfigServerUrl extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
                <div className="form-group">
                    <div className="col-5">
                        <label className="form-label" htmlFor="serverUrl">Server URL</label>
                    </div>
                    <div className="col-7">
                        <div className="input-group ">
                            <input
                                ref={node => this.serverUrlInput = node}
                                className="form-input"
                                type="text"
                                id="serverUrl"
                                placeholder="localhost:8080"
                                defaultValue={this.props.configClient.serverUrl}
                                disabled={(this.props.connection.connecting || this.props.connection.connected) ? 'disabled' : ''}
                            />
                            <button
                                className="btn btn-primary input-group-btn"
                                onClick={(e) => this.toggleConnection(e)}
                                disabled={this.props.connection.connecting ? 'disabled' : ''}
                            >
                                { this.props.connection.connecting ? <i className='form-icon loading' /> :
                                    this.props.connection.connected ? "Disconnect" : "Connect"
                                }
                            </button>
                        </div>
                    </div>
                </div>
                <div id="connectionHint" className="form-input-hint"/>
            </React.Fragment>
        );
    }

    toggleConnection(e) {
        e.preventDefault();

        if (this.props.connection.connected) {
            this.disconnect();
            return;
        }

        let serverUrl = this.serverUrlInput.value;

        this.props.dispatch({
            type: 'SET_SERVER_URL',
            serverUrl
        });

        this.connect();
    }

    connect() {
        NodeProxy.setServerUrl(this.props.configClient.serverUrl);
        NodeProxy.connect();
    }

    disconnect() {
        NodeProxy.close();
    }
}