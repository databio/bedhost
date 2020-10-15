import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import BedSetPlots from "./bedSetPlots";
import DownloadList from "./downloadList";
import StatsTable from "./statsTable";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import axios from "axios";
import bedhost_api_url from "./const";
import path from "path";
import { Label } from 'semantic-ui-react';

const api = axios.create({
    baseURL: bedhost_api_url,
});

export default class BedSetStats extends React.Component {
    constructor(props) {
        super();
        this.state = {
            bedSetName: "",
            bedSetSum: "",
            bedSetDownload: {},
            bedSetFig: []
        };
    }

    async componentDidMount() {
        let data = await api.get("/bedsets/splash/" + this.props.match.params.bedset_md5sum).then(({ data }) => data);
        this.setState(
            {
                bedSetName: data[0][2],
                bedSetSum: data[0][5],
                bedSetDownload: {
                    BED_Set_Rxiv: data[0][3], 
                    BED_Stats: data[0][4],
                    BED_Set_Summary: data[0][5], 
                    BED_Set_IGD: data[0][6],
                    BED_Set_PEP: data[0][7]
                },
                bedSetFig: data[0][8][0],
            }
        );

        const newbedSetFig = { ...this.state.bedSetFig, src: path.join("/outputs/bedbuncher_output", this.props.match.params.bedset_md5sum, this.state.bedSetName + "_" + this.state.bedSetFig.name) };
        this.setState({ bedSetFig: newbedSetFig });
        console.log("BED set data retrieved from the server: ", data);
    }

    render() {
        return (
            <div style={{ height: "100%", overflow: "scroll" }}>
                <Header />
                <Container fluid className="p-4">
                    <Row>
                        <Col>
                            <h1>BED Set: {this.state.bedSetName}</h1>
                        </Col>
                    </Row>
                </Container>
                <Container fluid className="p-4">
                    <Row>
                        <Col md={8}>
                            <Label style={{ marginLeft: '15px', fontSize: '15px' }} as='a' color='teal' ribbon>
                                Bedset Stats Table
                            </Label>
                            {this.state.bedSetSum ? (
                                <StatsTable dataSrc={this.state.bedSetSum.match(/\/outputs\/.*/)} />
                            ) : null}
                        </Col>
                        <Col >
                            <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                                {this.state.bedSetFig.caption}
                            </Label>
                            {this.state.bedSetFig.src ? (
                                <BedSetPlots data={this.state.bedSetFig} />
                            ) : null}
                            <Label style={{ marginLeft: '15px', fontSize: '15px' }} as='a' color='teal' ribbon>
                                Bedset Download List
                            </Label>
                            <DownloadList list={this.state.bedSetDownload} />
                        </Col>

                    </Row>
                </Container>
                <VersionsSpan />
            </div>
        )
    }
}