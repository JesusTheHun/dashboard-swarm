import React from "react";

export class Header extends React.Component {
    render() {
        return (
            <div className="panel-header text-center">
                <div className="panel-title h5 mt-10">
                    { this.props.children }
                    <a onClick={(e) => {
                        e.preventDefault();
                        this.props.toggleConfig();
                    }} id="configLink" href="::javascript"><i className={ "fa " + (this.props.open ? "fa-close" : "fa-cogs" ) }/></a>
                </div>
            </div>
        )
    }
}