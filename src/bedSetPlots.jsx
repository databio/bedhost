import React from "react";
import bedhost_api_url from "./const";
import "./style/splash.css";

export default class BedSetPlots extends React.Component {
    render() {
        return (
            <div style={{ marginBottom: "10px" }}>
            <a href={bedhost_api_url + "/api/img/bedsets/" + this.props.bedset_md5sum + "/" + this.props.bedset_figs.name + "/pdf"}>
                <img
                    className="splash-img"
                    src={bedhost_api_url + "/api/img/bedsets/" + this.props.bedset_md5sum + "/" + this.props.bedset_figs.name + "/png"}
                    alt={this.props.bedset_md5sum}
                />
            </a>
        </div>
        );
    }
}
