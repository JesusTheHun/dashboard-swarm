import React from "react";
import {LocalAction} from "../actions/local";

export class Displays extends React.Component {
    render() {
        return (
            <div id="displayList" className="panel-nav">
                <ul className="tab tab-block">
                    { this.props.displays.map((display, index) => {
                        return <li className={
                            "tab-item" + (this.props.activeDisplay === index ? " active" : "")
                        } key={index} onClick={() => this.setActiveDisplay(index) }>
                            <a href="#" onClick={(e) => e.preventDefault()}>{this.getDisplayName(index)}</a>
                        </li>
                    })}
                </ul>
            </div>
        );
    }

    getDisplayName(index) {
        return "Display " + index;
    }

    setActiveDisplay(id) {
        this.props.dispatch(LocalAction.ACTIVE_DISPLAY(id));
    }
}