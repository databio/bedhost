import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Label } from 'semantic-ui-react';
import "./style/home.css"

export default class About extends React.Component {
    // constructor(props) {
    //     super();
    //     this.state = {
    //         search: "bedfiles",
    //         setbtn: false,
    //         filebtn: true
    //     };
    // }

    // handleClick(type) {
    //     this.setState({ search: type });
    //     if (type === "bedsets") {
    //         this.setState({ filebtn: false, setbtn: true })
    //     } else {
    //         this.setState({ filebtn: true, setbtn: false })
    //     }
    // };

    render() {
        return (
            <React.StrictMode >
                <Header />
                
                <VersionsSpan />
            </React.StrictMode>
        )
    }
}