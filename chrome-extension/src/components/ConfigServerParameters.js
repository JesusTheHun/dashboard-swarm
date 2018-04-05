import React from "react";
import {ApiCommand} from "../actions/commands";
import Logger from "js-logger/src/logger";
import {connect} from "react-redux";

const logger = Logger.get('ConfigServerParametersComponent');

class ConfigServerParametersComponent extends React.Component {
    constructor(props) {
        super(props);

        this.configAttributes = {
            'tabSwitchInterval': {label: 'Tab interval', placeholder: 'seconds'},
            'flashTabSwitchInterval': {label: 'Flash tab interval', placeholder: 'seconds'},
            'flashTabLifetime': {label: 'Flash tab lifetime', placeholder: 'minutes'},
        };
        this.configInputsRefs = {};
        this.state = {attributes: {}};
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        let state = {attributes: {}};

        Object.keys(nextProps.configServer).map(attributeName => {
            state.attributes[attributeName] = nextProps.connection.connected ? nextProps.configServer[attributeName] : '';
        });

        return state;
    }

    handleChange(attributeName) {
        this.setState(prevState => {
            let attributes = {...prevState.attributes};
            attributes[attributeName] = parseInt(this.configInputsRefs[attributeName].value);
            return {attributes: attributes};
        });
    }

    render() {
        return (
            <fieldset id="parameters">

                <legend>Server parameters</legend>

                { Object.keys(this.configAttributes).map(attributeName => {
                    let configAttribute = this.configAttributes[attributeName];

                    return <div className="form-group">
                        <div className="col-5">
                            <label className="form-label" htmlFor={attributeName}>{configAttribute.label}</label>
                        </div>
                        <div className="col-7">
                            <input
                                type="text"
                                className="form-input"
                                id={attributeName}
                                placeholder={configAttribute.placeholder}
                                disabled={this.props.connection.connected ? '' : 'disabled'}
                                value={this.props.connection.connected ? this.state.attributes[attributeName] : ''}
                                ref={node => this.configInputsRefs[attributeName] = node}
                                onChange={() => this.handleChange(attributeName)}
                            />
                        </div>
                    </div>
                })}

                <div className="form-group">
                    <div className="col-5"/>
                    <div className="col-7">
                        <button className="btn btn-primary" id="save"
                            disabled={this.props.connection.connected ? '' : 'disabled'}
                            onClick={(e) => this.send(e)}
                        >Send</button>
                    </div>
                </div>

            </fieldset>
        );
    }

    send(e) {
        e.preventDefault();
        this.props.dispatch(ApiCommand.SERVER_CONFIG(this.state.attributes));
    }
}

export const ConfigServerParameters = connect(store => {
    return { configServer: store.configServer, connection: store.connection }
})(ConfigServerParametersComponent);