import React from "react";
import Logger from "js-logger/src/logger";

const logger = Logger.get('EditableTextComponent');

export class EditableText extends React.Component {

    /**
     * @param { {inputAttributes: any[], textAttributes: any[], editCallback: ?function} } props
     */
    constructor(props) {
        super(props);

        this.inputAttributes = this.props.inputAttributes || [];
        this.textAttributes = this.props.textAttributes || [];

        this.state = {
            content: this.props.children,
            editing: false
        };
    }

    render() {
        if (this.state.editing) {
            return <input
                type="text"
                defaultValue={this.state.content}
                ref={node => this.textInput = node}
                onBlur={ () => this.handleBlur() }
                onKeyDown={ (e) => this.handleKeyboardActions(e) }
                {...this.inputAttributes}
            />;
        }

        return <div onClick={ () => this.enterEditMode() } {...this.textAttributes}>{this.state.content}</div>
    }

    handleBlur() {
        this.leaveEditMode();
        this.saveChanges();
    }

    leaveEditMode() {
        this.setState({editing: false, content: this.textInput.value});
    }

    enterEditMode() {
        this.setState({editing: true}, () => {
            this.textInput.focus();
        });
    }

    cancelChanges() {
        this.setState({content: this.textInput.defaultValue});
    }

    saveChanges() {
        if (this.props.editCallback) this.props.editCallback(this.state.content);
    }

    handleKeyboardActions(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            e.stopPropagation();
            this.leaveEditMode();
            this.saveChanges();
        }

        if (e.keyCode === 27) {
            e.preventDefault();
            e.stopPropagation();
            this.leaveEditMode();
            this.cancelChanges();
        }
    }
}