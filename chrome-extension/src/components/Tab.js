/*global chrome*/

import React from "react";

export class Tab extends React.Component {
    render() {
        return (
            <div className="tile" data-id={this.props.id}>
                <div className="tile-action icon-column">
                    <div><i className="icon icon-upward hover-only" onClick={ () => this.moveUp() }/></div>
                    <div><i className="icon icon-downward hover-only" onClick={ () => this.moveDown() }/></div>
                </div>
                <div className="tile-content">
                    <div className="tile-title"><i className={ "fa fa-bolt watermark flashIcon" + (this.props.flash) ? 'js-flashicon' : '' }/>{this.props.title}</div>
                    <div className="tile-subtitle">{this.props.url}</div>
                </div>
                <div className="tile-action">
                    <div className="btn btn-link btn-action btn-lg js-param-button" onClick={() => this.props.openTabActions()}>
                        <i className="icon icon-caret"/>
                    </div>
                </div>
            </div>
        )
    }

    moveUp() {
        chrome.runtime.sendMessage({node: "updateTab", args: [this.props.id, {position: this.props.position - 1}]});
    }

    moveDown() {
        chrome.runtime.sendMessage({node: "updateTab", args: [this.props.id, {position: this.props.position + 1}]});
    }
}