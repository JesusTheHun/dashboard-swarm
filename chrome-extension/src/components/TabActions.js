/*global chrome*/

import React from "react";
import {ApiCommand} from "../actions/commands";

export class TabActions extends React.Component {
    render() {
        return (
            <div className="modal active" id="tabActions">
                <div className="modal-overlay"/>
                <div className="modal-container">
                    <div className="modal-header">
                        <button onClick={() => this.props.closeTabActions()} className="btn btn-clear float-right"/>
                        <div className="modal-title h6">{ this.props.tab.title }</div>
                    </div>
                    <div className="modal-body">
                        <div className="content">
                            <div className="commands">
                                <div className="button-row">
                                    <button onClick={() => this.sendToForeground() } className="btn btn-primary">Foreground</button>
                                    <button onClick={() => this.refreshTab() } className="btn">Refresh</button>
                                    <button onClick={() => this.closeTab() } className="btn btn-link">Remove</button>
                                </div>

                                <br />
                                <h6>Display</h6>
                                <div className="displays">
                                    { this.props.displays.map((display, displayNumber) => {
                                        return <button
                                            className="btn"
                                            disabled={displayNumber === this.props.tab.display ? "disabled" : ""}
                                            onClick={() => this.sendTabToDisplay(displayNumber) }
                                        >{ displayNumber }</button>
                                    }) }
                                </div>

                                <br/>
                                <div id="zoomAndScroll">
                                    <div>
                                        <h6>Zoom <small id="zoomLabel"/>{ Math.round((this.props.tab.zoom || 1) * 100) + " %" }</h6>
                                        <div>
                                            <button className="btn btn-link" id="zoomOut" onClick={() => this.zoomOut() }><i className="icon icon-minus"/>
                                            </button>
                                            <button className="btn btn-link" id="zoomIn" onClick={() => this.zoomIn() }><i className="icon icon-plus"/></button>
                                        </div>
                                    </div>
                                    <div>
                                        <h6>Scroll</h6>
                                        <div>
                                            <button className="btn btn-link" onClick={() => this.scroll('top')}><i className="icon icon-upward"/>
                                            </button>
                                            <button className="btn btn-link" onClick={() => this.scroll('bottom')}><i className="icon icon-downward"/>
                                            </button>
                                            <button className="btn btn-link" onClick={() => this.scroll('right')}><i className="icon icon-back"/>
                                            </button>
                                            <button className="btn btn-link" onClick={() => this.scroll('left')}><i className="icon icon-forward"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div id="autorefresh">
                                    <form action="#" className="form-horizontal">
                                        <div className="form-group">
                                            <div className="col-4">
                                                <label className="form-label h6" htmlFor="tabAutorefresh">Auto refresh</label>
                                            </div>
                                            <div className="col-2">
                                                <input
                                                    value={this.props.tab.autorefresh}
                                                    onChange={(e) => this.setAutorefresh(e)}
                                                    className="form-input"
                                                    type="text"
                                                    id="tabAutorefresh"
                                                    placeholder="Seconds"
                                                    size="6"
                                                />
                                            </div>
                                            <div className="col-5">
                                                <label className="form-label" htmlFor="tabAutorefresh">&nbsp;&nbsp;seconds</label>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    sendToForeground() {
        this.props.dispatch(ApiCommand.SEND_TAB_TO_FOREGROUND(this.props.tab.id));
    }

    refreshTab() {
        this.props.dispatch(ApiCommand.RELOAD_TAB(this.props.tab.id));
    }

    closeTab() {
        this.props.dispatch(ApiCommand.CLOSE_TAB(this.props.tab.id));
        this.props.closeTabActions();
    }

    sendTabToDisplay(display) {
        this.props.dispatch(ApiCommand.SEND_TAB_TO_DISPLAY(this.props.tab.id, display));
    }

    zoomIn() {
        this.props.dispatch(ApiCommand.ZOOM_TAB(this.props.tab.id, (this.props.tab.zoom || 1) + 0.05));
    }

    zoomOut() {
        this.props.dispatch(ApiCommand.ZOOM_TAB(this.props.tab.id, (this.props.tab.zoom || 1) - 0.05));
    }

    scroll(direction) {
        this.props.dispatch(ApiCommand.SCROLL_TAB(this.props.tab.id, direction));
    }

    setAutorefresh(e) {
        this.props.dispatch(ApiCommand.SET_TAB_AUTOREFRESH(this.props.tab.id, parseInt(e.target.value)));
    }
}