/*global chrome*/

import React from "react";
import {ApiCommand} from "../actions/commands";
import {EditableText} from "./EditableText";

export class Tab extends React.Component {
    render() {
        return (
            <div className="tile" data-id={this.props.id}>
                <div className="tile-action icon-column">
                    <div><i className="icon icon-upward hover-only" onClick={ () => this.moveUp() }/></div>
                    <div><i className="icon icon-downward hover-only" onClick={ () => this.moveDown() }/></div>
                </div>
                <div className="tile-content">
                    <div className="tile-title">
                        <i className={ "fa fa-bolt watermark flashIcon" + (this.props.flash) ? 'js-flashicon' : '' }/>
                        <EditableText
                            inputAttributes={{className: "form-input low-profile"}}
                            editCallback={ (newTitle) => this.changeTitle(newTitle) }
                        >{ this.props.userTitle ? this.props.userTitle : this.props.title}</EditableText>
                    </div>
                    <EditableText
                        inputAttributes={{className: "form-input low-profile"}}
                        textAttributes={{className: "tile-subtitle"}}
                        editCallback={ (newUrl) => this.changeUrl(newUrl) }
                    >{this.props.url}</EditableText>
                </div>
                <div className="tile-action">
                    <div className="btn btn-link btn-action btn-lg js-param-button" onClick={() => this.props.openTabActions()}>
                        <i className="icon icon-caret"/>
                    </div>
                </div>
            </div>
        )
    }

    changeTitle(newTitle) {
        if (newTitle !== this.props.title) {
            this.props.dispatch(ApiCommand.SET_TAB_TITLE(this.props.id, newTitle));
        }
    }

    changeUrl(newUrl) {
        if (newUrl !== this.props.url) {
            this.props.dispatch(ApiCommand.SET_TAB_URL(this.props.id, newUrl));
        }
    }

    moveUp() {
        this.props.dispatch(ApiCommand.MOVE_TAB(this.props.id, this.props.position - 1));
    }

    moveDown() {
        this.props.dispatch(ApiCommand.MOVE_TAB(this.props.id, this.props.position + 1));
    }
}