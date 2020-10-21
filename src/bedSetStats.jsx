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
                    BED_Set_Rxiv: bedhost_api_url+"/bedsets/download/"+ this.props.match.params.bedset_md5sum +"?column=bedset_tar_archive_path", 
                    BED_Stats:  bedhost_api_url+"/bedsets/download/"+ this.props.match.params.bedset_md5sum +"?column=bedset_bedfiles_gd_stats",
                    BED_Set_Summary:  bedhost_api_url+"/bedsets/download/"+ this.props.match.params.bedset_md5sum +"?column=bedset_gd_stats", 
                    BED_Set_IGD:  bedhost_api_url+"/bedsets/download/"+ this.props.match.params.bedset_md5sum +"?column=bedset_igd_database_path",
                    BED_Set_PEP:  bedhost_api_url+"/bedsets/download/"+ this.props.match.params.bedset_md5sum +"?column=bedset_pep"
                },
                bedSetFig: data[0][8][0],
            }
        );

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
                            
                                <StatsTable bedset_md5sum={this.props.match.params.bedset_md5sum} />
                           
                        </Col>
                        <Col >
                            <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                                {this.state.bedSetFig.caption}
                            </Label>
                            
                                <BedSetPlots bedset_md5sum={this.props.match.params.bedset_md5sum} />
                            
                            <Label style={{ marginLeft: '15px', fontSize: '15px' }} as='a' color='teal' ribbon>
                                BED Set Download List
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