import React from "react";
import nodeProxy from "../channels/NodeProxy";

import {connect} from "react-redux";
import {ConfigMaster} from "./ConfigMaster";
import {ConfigServerUrl} from "./ConfigServerUrl";
import {ConfigServerParameters} from "./ConfigServerParameters";

const NodeProxy = new nodeProxy();

export class Config extends React.Component {
    render() {
        return (
            <div id="config">
                <div className="panel-body">
                    <form action="#" className="form-horizontal">

                        <div className="text-center">
                            <button id="restart" className="btn" onClick={() => this.restartSwarm()}>Restart the Swarm</button>
                        </div>

                        <ConfigMaster />
                        <ConfigServerUrl />
                        <ConfigServerParameters />
                    </form>
                </div>
            </div>
        );
    }

    restartSwarm() {
        NodeProxy.restart();
    }
}