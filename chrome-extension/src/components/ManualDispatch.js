import React from "react";

export class ManualDispatch extends React.Component {
    constructor(props) {
        super(props);

        this.tabId = 0;
    }

    render() {
        return (
            <div>
                <button onClick={() => this.waitingMaster(true)}>Wait Master</button>
                <button onClick={() => this.waitingMaster(false)}>Master Received</button>
                <button onClick={() => this.play() }>Play</button>
                <button onClick={() => this.stop() }>Stop</button>
                <button onClick={() => this.addTab(0) }>Add tab on display 0</button>
                <button onClick={() => this.addTab(1) }>Add tab on display 1</button>
                <button onClick={() => this.setDisplays() }>Init displays</button>
                <button onClick={() => this.activeDisplay(0) }>Activate display 0</button>
                <button onClick={() => this.activeDisplay(1) }>Activate display 1</button>
                <button onClick={() => this.setConnected(true) }>Connected</button>
                <button onClick={() => this.setConnected(false) }>Not Connected</button>
            </div>
        );
    }

    waitingMaster(bool) {
        this.props.dispatch({
            type: 'WAITING_MASTER',
            waiting: bool
        });
    }

    play() {
        this.props.dispatch({
            type: 'ROTATION_PLAYING',
            playing: true
        });
    }

    stop() {
        this.props.dispatch({
            type: 'ROTATION_PLAYING',
            playing: false
        });
    }

    setDisplays() {
        this.props.dispatch({
            type: 'DISPLAYS',
            displays: [
                {},
                {}
            ]
        })
    }

    activeDisplay(i) {
        this.props.dispatch({
            type: 'ACTIVE_DISPLAY',
            activeDisplay: i
        })
    }

    addTab(display) {
        this.props.dispatch({
            type: 'TAB_ADDED',
            tab: {
                id: this.tabId++,
                display,
                text: "Tab" + this.tabId
            }
        });
    }

    setConnected(bool) {
        this.props.dispatch({
            type: 'CONNECTED',
            connected: bool
        });
    }
}