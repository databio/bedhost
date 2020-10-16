import React from "react";
import "./style/splash.css";


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
                        className="splash-img"
                        src={require(`${this.state.pngPath}`)}
                        alt={this.props.data.name}
                    />
                </a>
            </div>
        );
    }
}
