import React from "react";
import ModalImage from "./modalImage";

export default class BedSetPlots extends React.Component {
    render() {
        return (
            <div style={{ marginBottom: "10px" }}>
                <span>
                    Region commonality
                </span>
                <ModalImage style={{ marginTop: "90px" }} image={this.props.bedset_figs[0]} page="bedset" />
            </div>
        );
    }
}