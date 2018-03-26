/*global chrome*/

import React from "react";
import {Header} from "./Header";
import {Scene} from "./Scene";
import {Footer} from "./Footer";
import {connect} from "react-redux";
import {ManualDispatch} from "./ManualDispatch";
import {Config} from "./Config";
import Logger from "js-logger/src/logger";

const logger = Logger.get('PopupComponent');

export class Popup extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isConfigOpen: false
        };
    }

    render() {
        const LiveScene = connect(store => {
            return { waitingMaster: store.waitingMaster }
        })(Scene);

        const LiveConfig = connect(store => {
           return { config: store.config }
        })(Config);

        const LiveManualDispatch = connect()(ManualDispatch);

        return (
            <div className="Popup" id="displays">
                <div className="panel">
                    <Header toggleConfig={ () => this.toggleConfig() } open={this.state.isConfigOpen}>Dashboard Swarm</Header>
                    { this.state.isConfigOpen ?
                        <LiveConfig/>
                        : <div><LiveScene/><Footer /></div>
                    }

                    { !chrome || !chrome.runtime.onMessage ? <LiveManualDispatch/> : ''}
                </div>
            </div>
        )
    }

    toggleConfig() {
        this.setState(prev => {
            return {isConfigOpen: !prev.isConfigOpen};
        });
    }
}