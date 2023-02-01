import React from "react";
import { useParams } from 'react-router-dom';
import { HashLink as Link } from "react-router-hash-link";
import { BsQuestionCircle } from "react-icons/bs";
import { FaExternalLinkAlt } from "react-icons/fa";
import bedhost_api_url from "../const/server";


export default function BedInfo(props) {
  const params = useParams()

  return (
    <div>
      <h4>
        Summary
        <a href={
          `${bedhost_api_url}/api/bed/${params.bed_md5sum}/metadata?ids=other`
        }>
          <FaExternalLinkAlt
            style={{
              marginBottom: "3px",
              marginLeft: "10px",
              fontSize: "15px",
            }}
            color="teal"
          />
        </a>
      </h4>
      <table style={{ marginBottom: "10px" }}>
        <tbody>
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
              "URL",
              "ensdb",
              "fasta",
              "format",
              "ensDb_Gtf",
              "fasta_file",
              "sample_name"
            ];

            return !hide.includes(key) ? (
              <tr style={{ verticalAlign: "top" }} key={index}>
                <td
                  style={{
                    padding: "3px 10px",
                    fontWeight: "bold",
                    width: '200px'
                  }}
                >
                  {key.charAt(0).toUpperCase() +
                    key.replaceAll("_", " ").slice(1)}
                </td>
                <td
                  style={{
                    padding: "3px 10px",
                    width: "200px"
                  }}
                >
                  {key === "genome" ? (
                    <>
                      <span>{props.bed_genome.alias}</span>
                      {props.bed_genome.digest !== "" ? (
                        <a
                          href={
                            `http://refgenomes.databio.org/v3/genomes/splash/${props.bed_genome.digest}`
                          }
                          className="home-link"
                          style={{
                            marginLeft: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          [Refgenie]
                        </a>
                      ) : null
                      }
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
      <h4>
        Statistics
        <Link to="/about#bedfile-stats">
          <BsQuestionCircle
            style={{
              marginBottom: "3px",
              marginLeft: "10px",
              fontSize: "15px",
            }}
            color="black"
          />
        </Link>
        <a href={
          `${bedhost_api_url}/api/bed/${params.bed_md5sum}/metadata?${props.bedStats_cols}`
        }>
          <FaExternalLinkAlt
            style={{
              marginBottom: "3px",
              marginLeft: "10px",
              fontSize: "15px",
            }}
            color="teal"
          />
        </a>
      </h4>

      <table style={{ marginBottom: "10px" }}>
        <tbody>
          {props.bed_stats.map((value, index) => (
            <tr style={{ verticalAlign: "top" }} key={index}>
              {value.data !== null ? (
                <><td
                  style={{
                    padding: "3px 10px",
                    fontWeight: "bold",
                    width: '200px'
                  }}
                >
                  {value.label ===
                    "Median absolute distance from transcription start sites" ? (
                    <>Median TSS distance</>
                  ) : (
                    <>{value.label}</>
                  )}
                </td>
                  <td
                    style={{
                      padding: "3px 10px",
                      width: '200px'
                    }}
                  >
                    {value.label === "Number of regions" ? (
                      <>{value.data.toFixed(0)}</>
                    ) : (
                      <>{value.data.toFixed(3)}</>
                    )}
                  </td></>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
