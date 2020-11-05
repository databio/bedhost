import React from "react";
import axios from "axios";
import bedhost_api_url from "./const";

const api = axios.create({
    baseURL: bedhost_api_url + "/api",
});

export default class BedInfo extends React.Component {
    constructor(props) {
        super();
        this.state = {
            dict: {},
        };
    }

    async componentDidMount() {
        let data = await api.get("/bedfiles/splash/" + this.props.bedfile_md5sum + "?column=other").then(({ data }) => data);
        this.setState(
            {
                dict: data[0][0]
            })
        console.log("BED file info from API:", this.state.dict)
    }

    render() {
        return (
            <div >
                <table >
                    <tbody>
                        {Object.entries(this.state.dict)
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

            </div>
        )
    }
}