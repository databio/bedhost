import React from "react";
import axios from "axios";
import toObject from "./toObject";
import bedhost_api_url from "./const";

const api = axios.create({
    baseURL: bedhost_api_url,
});

export default class BedInfo extends React.Component {
    constructor(props) {
        super();
        this.state = {
            bed_info: {},
            bed_stats: {}
        };
    }

    async componentDidMount() {
        let data = await api.get("/api/bed/" + this.props.bedfile_md5sum + "/data?ids=other").then(({ data }) => data);
        this.setState(
            {
                bed_info: data.data[0][0]
            })
        console.log("BED file info from the server:", this.state.bed_info)

        data = await api.get("/api/bed/" + this.props.bedfile_md5sum +
            "/data?ids=gc_content&ids=regions_no&ids=mean_absolute_tss_dist&ids=mean_region_width&ids=exon_percentage&ids=intron_percentage&ids=promoterprox_percentage&ids=intergenic_percentage&ids=promotercore_percentage&ids=fiveutr_percentage&ids=threeutr_percentage")
            .then(({ data }) => data);
        this.setState(
            {
                bed_stats: toObject(data.columns, data.data[0])
            })
        console.log("BED file stats from the server:", this.state.bed_stats)
    }

    render() {
        return (
            <div >
                <table >
                <caption style={{captionSide: "top", fontSize: "12pt", fontWeight: "bold", color: "#e76f51" }}>BED File Info</caption>
                    <tbody>
                        {Object.entries(this.state.bed_info)
                            .map(([key, value], index) =>
                                <tr style={{ verticalAlign: "top" }} key={index}>
                                    <td style={{ padding: "3px 15px", fontSize: "12pt", fontWeight: "bold", color: "teal" }}>
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </td>
                                    <td style={{ padding: "3px 15px", fontSize: "12pt" }}>
                                        {value}
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
                <table >
                <caption style={{captionSide: "top", fontSize: "12pt", fontWeight: "bold", color: "#e76f51" }}>BED File Stats</caption>
                    <tbody>
                        {Object.entries(this.state.bed_stats)
                            .map(([key, value], index) =>
                                <tr style={{ verticalAlign: "top" }} key={index}>
                                    <td style={{ padding: "3px 15px", fontSize: "12pt", fontWeight: "bold", color: "teal" }}>
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </td>
                                    <td style={{ padding: "3px 15px", fontSize: "12pt" }}>
                                        {value}
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>

            </div >
        )
    }
}