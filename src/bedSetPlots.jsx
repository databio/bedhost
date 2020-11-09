import React from "react";
import bedhost_api_url from "./const";
import "./style/splash.css";

export default class BedSetPlots extends React.Component {
    render() {
        return (
            <div style={{ marginBottom: "10px" }}>
            <a  target="_blank"  rel="noopener noreferrer" href={bedhost_api_url + "/api/bedset/" + this.props.bedset_md5sum + "/img/" + this.props.bedset_figs.name + "?format=pdf"}>
                <img
                    className="splash-img"
                    src={bedhost_api_url + "/api/bedset/" + this.props.bedset_md5sum + "/img/" + this.props.bedset_figs.name + "?format=png"}
                    alt={this.props.bedset_md5sum}
                />
            </a>
        </div>
        );
    }
}