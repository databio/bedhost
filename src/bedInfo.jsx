import React from "react";
import axios from "axios";
import bedhost_api_url from "./const";

const api = axios.create({
    baseURL: bedhost_api_url,
});

export default class BedInfo extends React.Component {
    constructor(props) {
        super();
        this.state = {
            list: ["genome", "exp_protocol", "cell_type", "tissue",
                "antibody", "treatment", "data_source", "GSE", "description"],
            dict: {},
        };
    }

    async componentDidMount() {
        let data = await api.get("/bed/info/" + this.props.bedfile_md5sum).then(({ data }) => data);
        this.setState(
            {
                dict: data
            })
        console.log("BED file sample yaml from API:", this.state.dict)
    }

    render() {
        return (
            <div >
                <table >
                    <tbody>
                        {Object.entries(this.state.dict)
                            .map(([key, value], index) => this.state.list.includes(key) ? (
                                <tr style={{ verticalAlign: "top" }} key={index}>
                                    <td style={{ padding:"3px 15px", fontSize: "12pt", fontWeight: "bold", color: "teal" }}>
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </td>
                                    <td style={{ padding:"3px 15px", fontSize: "12pt" }}>
                                        {value}
                                    </td>

                                </tr>)
                                : null
                         
                            )}
                    </tbody>
                </table>

            </div>
        )
    }
}