import React from "react";
import axios from "axios";
import { Label } from 'semantic-ui-react';
import { HashLink as Link } from 'react-router-hash-link';
import { FaQuestionCircle } from "react-icons/fa";
import bedhost_api_url from "./const";

const api = axios.create({
    baseURL: bedhost_api_url,
});

export default class BedInfo extends React.Component {
    constructor(props) {
        super();
        this.state = {
            bed_info: {},
            bed_stats: [],
            description: "",
            genome:{}
        };
    }

    async componentDidMount() {
        let data = await api.get("/api/bed/" + this.props.bed_md5sum + "/data?ids=other").then(({ data }) => data);
        this.setState(
            {
                bed_info: data.data[0][0]
            })
        console.log("BED file info from the server:", this.state.bed_info)
        data = await api.get("/api/bed/" + this.props.bed_md5sum + "/data?ids=genome").then(({ data }) => data);
        this.setState(
            {
                genome: data.data[0][0]
            })
        data = await api.get("/api/bed/" + this.props.bed_md5sum +
            "/data?ids=gc_content&ids=regions_no&ids=mean_absolute_tss_dist&ids=mean_region_width&ids=exon_percentage&ids=intron_percentage&ids=promoterprox_percentage&ids=intergenic_percentage&ids=promotercore_percentage&ids=fiveutr_percentage&ids=threeutr_percentage")
            .then(({ data }) => data);
        let schema = await api.get("/api/bed/all/schema").then(({ data }) => data);

        let stats = []
        data.columns.map((value, index) => {
            stats.push({
                label: schema[data.columns[index]].description,
                data: data.data[0][index]
            }
            )
            return stats
        })
        this.setState(
            {
                bed_stats: stats
            }
        )
          
        console.log("BED file stats from the server:", this.state.bed_stats)
    }

    render() {
        return (
            <div >
                <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                    BED File Info
                </Label>
                <table >
                    <tbody>
                        <tr>     <th class="absorbing-column"></th>     <th></th>   </tr>
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
                                        {key.charAt(0).toUpperCase() + key.replaceAll("_", " ").slice(1)}
                                    </td>
                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                        {key === "genome" ?
                                            (<><span>{this.state.genome.alias}</span><a href={"http://refgenomes.databio.org/v3/genomes/splash/" + this.state.genome.digest} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>[Refgenie]</a></>)
                                            : value}
                                    </td>
                                </tr> : null)
                            }
                            )}
                    </tbody>
                </ table>
                <Label style={{ marginTop: "15px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                    BED File Stats <Link to='/about#bedfile-stats'> <FaQuestionCircle style={{ marginBottom: "3px", marginLeft: '10px', fontSize: '12px' }} color='white' /></Link>
                </Label>
                <table >
                    <tbody>
                        {this.state.bed_stats.map((value, index) =>
                            <tr style={{ verticalAlign: "top" }} key={index}>
                                <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold", color: "teal" }}>
                                    {value.label === "Mean absolute distance from transcription start sites" ?
                                        (<>Mean absolute distance from TSS</>) :
                                        (<>{ value.label }</>)}              
                                    </td>
                                <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                    {value.label === "Number of regions" ?
                                        (<>{value.data.toFixed(0)}</>) :
                                        (<>{value.data.toFixed(3)}</>)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )
    }
}