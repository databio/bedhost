import React from "react";

export default class BedSetPlots extends React.Component {
    constructor(props) {
        super();
        this.state = {
            pdfPath: "." + props.data.src + ".pdf",
            pngPath: "." + props.data.src + ".png"
        }
    }

    render() {
        return (
            <div>
                <a href={require(`${this.state.pdfPath}`)}>
                    <img
                        className="img-size"
                        src={require(`${this.state.pngPath}`)}
                        alt={this.props.data.name}
                    />
                </a>
            </div>
        );
    }
}
