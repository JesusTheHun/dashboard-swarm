import React from "react";

export class WaitingMaster extends React.Component {
    render() {
        return (
            <div id="waitingMaster" className="empty empty-sm waitingMaster">
                <p className="empty-title h5">Waiting for the master node <span className="loading"/></p>
            </div>
        )
    }
}