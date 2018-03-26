import React from "react";

export class Footer extends React.Component {
    render() {
        return (
            <div className="panel-footer">
                <div className="input-group">
                    <input type="text" className="form-input" placeholder="New dashboard url" id="dashboardUrl" />
                    <button className="btn btn-primary input-group-btn" id="addDashboard">Add</button>
                    <button className="btn input-group-btn" id="addDashboardFlash"><i className="fa fa-bolt"/></button>
                </div>
            </div>
        )
    }
}