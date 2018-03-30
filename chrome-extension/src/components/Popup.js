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
            configOpen: false
        };
    }

    render() {
        const LiveScene = connect(store => {
            return { waitingMaster: store.waitingMaster, tabs: store.tabs }
        })(Scene);

        const LiveConfig = connect(store => {
           return { config: store.config }
        })(Config);

        const LiveFooter = connect(store => {
            return { activeDisplay: store.activeDisplay }
        })(Footer);

        const LiveManualDispatch = connect()(ManualDispatch);

        return (
            <div className="Popup" id="displays">
                <div className="panel">
                    <Header toggleConfig={ () => this.toggleConfig() } open={this.state.configOpen}>Dashboard Swarm</Header>
                    { this.state.configOpen ?
                        <LiveConfig/>
                        : <div><LiveScene/><LiveFooter /></div>
                    }

                    { !chrome || !chrome.runtime.onMessage ? <LiveManualDispatch/> : ''}
                </div>
            </div>
        )
    }

    toggleConfig() {
        this.setState(prev => {
            return {configOpen: !prev.configOpen};
        });
    }
}