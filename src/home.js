import React from "react";
import QueryBuilderWrapper from './queryBuilder.jsx';
import BedCountsSpan from "./bedCountsSpan";
import BedSetList from "./bedSetList";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style/home.css"

export default class Home extends React.Component {
    constructor(props) {
        super();
        this.state = {
            search: "",
            setbtn: false,
            filebtn: true
        };
    }

    handleClick(type) {
        this.setState({ search: type });
        if (type === "bedsets"){
            this.setState({filebtn:false, setbtn: true})
        } else{
            this.setState({filebtn:true, setbtn: false})
        }
    };

    render() {
        return (
            <React.StrictMode style={{ height: "96%", overflow: "scroll" }}>
                <Header />
                <Container fluid className="p-4">
                    <Row>
                        <Col>
                            <BedCountsSpan />
                        </Col>
                    </Row>
                </Container>
                <Container fluid className="p-4">
                    <Row>
                        <Col>
                            <Row>
                                <Col md={6}>
                                    <button className='btn btn-block btn-sm my-btn'  disabled={this.state.filebtn} onClick={() => this.handleClick('bedfiles')}> Search BED Files </button>
                                </Col>
                                <Col md={6}>
                                    <button className='btn btn-block btn-sm my-btn'  disabled={this.state.setbtn} onClick={() => this.handleClick('bedsets')}> Search BED Sets </button>
                                </Col>
                            </Row>

                            {this.state.search === "bedsets" ? (
                                <QueryBuilderWrapper table_name='bedsets' />
                            ) : (
                                    <QueryBuilderWrapper table_name='bedfiles' />
                                )}
                        </Col>
                        <Col md={6}>
                            <BedSetList />
                        </Col>
                    </Row>
                </Container>
                <VersionsSpan />
            </React.StrictMode>
        )
    }
}