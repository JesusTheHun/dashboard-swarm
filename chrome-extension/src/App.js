import React from "react";
import { Provider } from 'react-redux';
import {Popup} from "./components/Popup";

class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Provider store={this.props.store} >
                <Popup />
            </Provider>
        )
    }
}

export default App;
