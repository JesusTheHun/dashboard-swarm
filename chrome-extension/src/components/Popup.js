/*global chrome*/

import React from "react";
import {Header} from "./Header";
import {Scene} from "./Scene";
import {Footer} from "./Footer";
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
        return (
            <div className="Popup" id="displays" ref={node => this.popup = node}>
                <div className="panel">
                    <Header
                        toggleConfig={() => this.toggleConfig()}
                        open={this.state.configOpen}
                    >Dashboard Swarm</Header>

                    { this.state.configOpen ?
                        <Config/> : <React.Fragment>
                            <Scene/>
                            <Footer/>
                        </React.Fragment>
                    }

                    { !chrome || !chrome.runtime.onMessage ? <ManualDispatch/> : ''}
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