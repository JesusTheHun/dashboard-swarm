import React from "react";

export class Player extends React.Component {

    render() {
        return (
            <div id="player">
                <div className="btn btn-link" id="playPause">
                    <i className={"fa " + (this.props.playing ? 'fa-stop' : 'fa-play') } onClick={event => () => this.togglePlay() } />
                </div>
            </div>
        );
    }

    togglePlay() {
        this.props.playing ? this.stop() : this.play();
    }

    play() {

    }

    stop() {

    }
}