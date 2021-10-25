import React from "react";
import axios from "axios";
import { Label } from "semantic-ui-react";
import { HashLink as Link } from "react-router-hash-link";
import { FaQuestionCircle } from "react-icons/fa";
import bedhost_api_url, { client } from "./const/server";
import {
  GET_BED_GENOME,
  GET_BED_META,
  GET_BED_STATS,
} from "./graphql/bedQueries";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedInfo extends React.Component {
  constructor(props) {
    super();
    this.state = {
      genome: {},
      bed_info: {},
      bed_stats: [],
      description: "",
    };
  }

  async componentDidMount() {
    // get bed genome via Graphql
    const genome = await client
      .query({
        query: GET_BED_GENOME,
        variables: { md5sum: this.props.bed_md5sum },
      })
      .then(({ data }) => data.bedfiles.edges[0].node.genome);

    // get meta data (`other` field) via Graphql
    const meta = await client
      .query({
        query: GET_BED_META,
        variables: { md5sum: this.props.bed_md5sum },
      })
      .then(({ data }) => data.bedfiles.edges[0].node.other);

    this.setState({
      genome: JSON.parse(genome),
      bed_info: JSON.parse(meta),
    });

    console.log("BED file info from the server:", this.state.bed_info);

    // get bed stats via Graphql
    const bed_stats = await client
      .query({
        query: GET_BED_STATS,
        variables: { md5sum: this.props.bed_md5sum },
      })
      .then(({ data }) => data.bedfiles.edges[0].node);

    // get bedfiles table schema via fastapi endpoint
    let schema = await api.get("/api/bed/all/schema").then(({ data }) => data);

    let stats = Object.entries(bed_stats).map(([key, value], index) => {
      return {
        label: schema[key.replace(/([A-Z])/g, "_$1").toLowerCase()].description,
        data: value,
      };
    });

    this.setState({
      bed_stats: stats,
    });

    console.log("BED file stats from the server:", this.state.bed_stats);
  }

  render() {
    return (
      <div>
        <Label
          style={{
            marginLeft: "15px",
            fontSize: "15px",
            padding: "6px 20px 6px 30px",
          }}
          color="teal"
          ribbon
        >
          BED File Info
        </Label>
        <table>
          <tbody>
            <tr>
              <th className="absorbing-column">{""}</th>
              <th>{""}</th>
            </tr>
            <tr style={{ verticalAlign: "top" }}>
              <td
                style={{
                  padding: "3px 15px",
                  fontSize: "10pt",
                  fontWeight: "bold",
                  color: "teal",
                }}
              >
                md5sum
              </td>
              <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                {this.props.bed_md5sum}
              </td>
            </tr>
            {Object.entries(this.state.bed_info).map(([key, value], index) => {
              const hide = [
                "bigbed",
                "file_name",
                "yaml_file",
                "bedbase_config",
                "output_file_path",
                "open_signal_matrix",
                "pipeline_interfaces",
                "pipeline_interfaces",
              ];

              return !hide.includes(key) ? (
                <tr style={{ verticalAlign: "top" }} key={index}>
                  <td
                    style={{
                      padding: "3px 15px",
                      fontSize: "10pt",
                      fontWeight: "bold",
                      color: "teal",
                    }}
                  >
                    {key.charAt(0).toUpperCase() +
                      key.replaceAll("_", " ").slice(1)}
                  </td>
                  <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                    {key === "genome" ? (
                      <>
                        <span>{this.state.genome.alias}</span>
                        <a
                          href={
                            "http://refgenomes.databio.org/v3/genomes/splash/" +
                            this.state.genome.digest
                          }
                          className="home-link"
                          style={{
                            marginLeft: "15px",
                            fontSize: "10pt",
                            fontWeight: "bold",
                          }}
                        >
                          [Refgenie]
                        </a>
                      </>
                    ) : (
                      value
                    )}
                  </td>
                </tr>
              ) : null;
            })}
          </tbody>
        </table>
        <Label
          style={{
            marginTop: "15px",
            marginLeft: "15px",
            fontSize: "15px",
            padding: "6px 20px 6px 30px",
          }}
          color="teal"
          ribbon
        >
          BED File Stats
          <Link to="/about#bedfile-stats">
            <FaQuestionCircle
              style={{
                marginBottom: "3px",
                marginLeft: "10px",
                fontSize: "12px",
              }}
              color="white"
            />
          </Link>
        </Label>
        <table>
          <tbody>
            {this.state.bed_stats.map((value, index) => (
              <tr style={{ verticalAlign: "top" }} key={index}>
                <td
                  style={{
                    padding: "3px 15px",
                    fontSize: "10pt",
                    fontWeight: "bold",
                    color: "teal",
                  }}
                >
                  {value.label ===
                    "Mean absolute distance from transcription start sites" ? (
                    <>Mean absolute distance from TSS</>
                  ) : (
                    <>{value.label}</>
                  )}
                </td>
                <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                  {value.label === "Number of regions" ? (
                    <>{value.data.toFixed(0)}</>
                  ) : (
                    <>{value.data.toFixed(3)}</>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
