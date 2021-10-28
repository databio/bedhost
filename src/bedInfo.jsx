import React from "react";
import { Label } from "semantic-ui-react";
import { HashLink as Link } from "react-router-hash-link";
import { FaQuestionCircle } from "react-icons/fa";

export default function BedInfo(props) {
  return (

    <div>
      {console.log("props:", props.bed_genome.alias, props.bed_genome.digest)}
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
              {props.bed_md5sum}
            </td>
          </tr>
          {Object.entries(props.bed_info).map(([key, value], index) => {
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
                      <span>{props.bed_genome.alias}</span>
                      <a
                        href={
                          "http://refgenomes.databio.org/v3/genomes/splash/" +
                          props.bed_genome.digest
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
          {props.bed_stats.map((value, index) => (
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
