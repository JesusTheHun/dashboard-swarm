import React from "react";
import {Parameters} from "../classes/Parameters";

export class ConfigServerParameters extends React.Component {
    componentDidMount() {
        this.handlePropsChange();
    }

    componentDidUpdate() {
        this.handlePropsChange();
    }

    handlePropsChange() {
        if (!this.props.connection.connected) {
            this.clearAndDisableServerParametersFields();
        } else {
            this.enableServerParametersFields();
            this.fillFieldsValues(this.props.configServer);
        }
    }

    render() {
        return (
            <fieldset id="parameters">

                <legend>Server parameters</legend>

                {/*Tab switch interval*/}
                <div className="form-group">
                    <div className="col-5">
                        <label className="form-label" htmlFor="tabSwitchInterval">Tab interval</label>
                    </div>
                    <div className="col-7">
                        <input className="form-input" type="text" id="tabSwitchInterval" placeholder="Seconds" />
                    </div>
                </div>

                {/*Flash tab switch interval*/}
                <div className="form-group">
                    <div className="col-5">
                        <label className="form-label" htmlFor="flashTabSwitchInterval">Flash tab interval</label>
                    </div>
                    <div className="col-7">
                        <input className="form-input" type="text" id="flashTabSwitchInterval" placeholder="Seconds" />
                    </div>
                </div>

                {/*Flash tab lifetime*/}
                <div className="form-group">
                    <div className="col-5">
                        <label className="form-label" htmlFor="flashTabLifetime">Flash tab lifetime</label>
                    </div>
                    <div className="col-7">
                        <input className="form-input" type="text" id="flashTabLifetime" placeholder="Minutes" />
                    </div>
                </div>

                <div className="form-group">
                    <div className="col-5"/>
                    <div className="col-7">
                        <button className="btn btn-primary" id="save">Send</button>
                    </div>
                </div>

            </fieldset>
        );
    }

    clearAndDisableServerParametersFields() {
        let configOptions = Parameters.getParametersName();

        configOptions.forEach(configName => {
            document.querySelector('#' + configName).value = '';
        });

        document.querySelector('#parameters').setAttribute('disabled', 'disabled');
    }

    enableServerParametersFields() {
        document.querySelector('#parameters').removeAttribute('disabled');
    }

    fillFieldsValues(values) {
        let configOptions = Parameters.getParametersName();

        configOptions.forEach(configName => {
            let value = '';
            if (values[configName] !== undefined) {
                value = values[configName];
            }

            let input = document.querySelector('#' + configName);

            if (input) {
                input.value = value;
            }
        });
    }
}