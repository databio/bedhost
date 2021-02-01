import React from "react";
import axios from "axios";
import toObject from "./toObject";
import SimplePopover from "./popover"
import { Label } from 'semantic-ui-react';
import bedhost_api_url from "./const";

const api = axios.create({
    baseURL: bedhost_api_url,
});

export default class BedInfo extends React.Component {
    constructor(props) {
        super();
        this.state = {
            bed_info: {},
            bed_stats: {},
            description: ""
        };
    }

    async componentDidMount() {
        let data = await api.get("/api/bed/" + this.props.bed_md5sum + "/data?ids=other").then(({ data }) => data);
        this.setState(
            {
                bed_info: data.data[0][0]
            })
        console.log("BED file info from the server:", this.state.bed_info)

        data = await api.get("/api/bed/" + this.props.bed_md5sum +
            "/data?ids=gc_content&ids=regions_no&ids=mean_absolute_tss_dist&ids=mean_region_width&ids=exon_percentage&ids=intron_percentage&ids=promoterprox_percentage&ids=intergenic_percentage&ids=promotercore_percentage&ids=fiveutr_percentage&ids=threeutr_percentage")
            .then(({ data }) => data);
        this.setState(
            {
                bed_stats: toObject(data.columns, data.data[0])
            })
        console.log("BED file stats from the server:", this.state.bed_stats)
    }

    handleGetDescription() {
        this.setState({
            description: 'gc_content: The average GC content of the region set. \n \n regions_no: The total number of regions in the BED file. \n \n  mean_absolute_tss_dist: The average absolute distance to the Transcription Start Sites (TSS). \n \n  mean_region_width: The average region width of the region set. \n \n  exon (%): The percentage of the regions in the BED file that are annotated as exon. \n \n  intron (%): The percentage of the regions in the BED file that are annotated as intron. \n \n promoterprox (%):	 The percentage of the regions in the BED file that are annotated as promoter-prox. \n \n  intergenic (%)The percentage of the regions in the BED file that are annotated as intergenic. \n \n promotercore (%):	The percentage of the regions in the BED file that are annotated as promoter-core. \n \n fiveutr (%):	The percentage of the regions in the BED file that are annotated as 5\'-UTR. \n \n threeutr(%): The percentage of the regions in the BED file that are annotated as 3\'-UTR. \n \n '
        });
    }

    render() {
        return (
            <div >
                <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                    BED File Info
                </Label>
                <table >
                    <tbody>
                        <tr style={{ verticalAlign: "top" }} >
                            <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold", color: "teal" }}>
                                md5sum
                            </td>
                            <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                {this.props.bed_md5sum}
                            </td>
                        </tr>
                        {Object.entries(this.state.bed_info)
                            .map(([key, value], index) => {
                                const hide = ['bigbed', 'file_name', 'yaml_file', 'bedbase_config', 'output_file_path', 'open_signal_matrix', 'pipeline_interfaces', 'pipeline_interfaces']

                                return (!hide.includes(key) ? <tr style={{ verticalAlign: "top" }} key={index}>
                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold", color: "teal" }}>
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </td>
                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                        {key === "genome" ?
                                            (<><span>{value}</span><a href={"http://refgenomes.databio.org/#" + value} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>[Refgenie]</a></>)
                                            : value}
                                    </td>
                                </tr> : null)
                            }
                            )}
                    </tbody>
                </ table>

                <Label style={{ marginTop: "15px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                    BED File Stats <SimplePopover onClick={this.handleGetDescription.bind(this)} message={this.state.description} />
                </Label>
                <table >
                    <tbody>
                        {Object.entries(this.state.bed_stats)
                            .map(([key, value], index) =>
                                <tr style={{ verticalAlign: "top" }} key={index}>
                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold", color: "teal" }}>
                                        {key.replaceAll("_percentage", " (%)")}
                                    </td>
                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                        {key === "regions_no" ?
                                            (<>{value.toFixed(0)}</>) :
                                            key.includes("_percentage") ?
                                                (<>{(value * 100).toFixed(3)}</>) :
                                                (<>{value.toFixed(3)}</>)}

                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
        )
    }
}