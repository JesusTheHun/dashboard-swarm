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

        const LiveFooter = connect(store => {
            return { activeDisplay: store.activeDisplay, browserActiveTab: store.browser.activeTab }
        })(Footer);

        const LiveManualDispatch = connect()(ManualDispatch);

        return (
            <div className="Popup" id="displays" ref={node => this.popup = node}>
                <div className="panel">
                    <Header toggleConfig={ () => this.toggleConfig() } open={this.state.configOpen}>Dashboard Swarm</Header>
                    { this.state.configOpen ?
                        <Config/>
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