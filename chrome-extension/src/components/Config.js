import React from "react";
import nodeProxy from "../channels/NodeProxy";

import {connect} from "react-redux";
import {ConfigMaster} from "./ConfigMaster";
import {ConfigServerUrl} from "./ConfigServerUrl";
import {ConfigServerParameters} from "./ConfigServerParameters";

const NodeProxy = new nodeProxy();

export class Config extends React.Component {
    render() {

        const LiveConfigMaster = connect(store => {
            return { configClient: store.configClient }
        })(ConfigMaster);

        const LiveConfigServerUrl = connect(store => {
            return { configClient: store.configClient, connection: store.connection }
        })(ConfigServerUrl);

        const LiveConfigServerParameters = connect(store => {
            return { configServer: store.configServer, connection: store.connection }
        })(ConfigServerParameters);

        return (
            <div id="config">
                <div className="panel-body">
                    <form action="#" className="form-horizontal">

                        <div className="text-center">
                            <button id="restart" className="btn" onClick={() => this.restartSwarm()}>Restart the Swarm</button>
                        </div>

                        <LiveConfigMaster />
                        <LiveConfigServerUrl />
                        <LiveConfigServerParameters />

                    </form>
                </div>
            </div>
        );
    }

    restartSwarm() {
        NodeProxy.restart();
    }
}