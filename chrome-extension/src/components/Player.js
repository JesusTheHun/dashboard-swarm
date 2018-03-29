import React from "react";
import {ApiCommand} from "../actions/commands";

export class Player extends React.Component {

    render() {
        return (
            <div id="player">
                <div className="btn btn-link" id="playPause">
                    <i className={"fa " + (this.props.playing ? 'fa-stop' : 'fa-play') } onClick={ () => this.togglePlay() } />
                </div>
            </div>
        );
    }

    togglePlay() {
        this.props.playing ? this.stop() : this.play();
    }

    play() {
        this.props.dispatch(ApiCommand.START_ROTATION());
    }

    stop() {
        this.props.dispatch(ApiCommand.STOP_ROTATION());
    }
}