import React from "react";
import bedhost_api_url from "./const";
import "./style/splash.css";


export default class BedSetPlots extends React.Component {

    render() {
        return (
            <div>
                <a href={bedhost_api_url+"/bedsets/img/"+ this.props.bedset_md5sum+"?img_type=pdf"}>
                    <img
                        className="splash-img"
                        src={bedhost_api_url+"/bedsets/img/"+ this.props.bedset_md5sum+"?img_type=png"}
                        alt={this.props.bedset_md5sum}
                    />
                </a>
            </div>
        );
    }
}
