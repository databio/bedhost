import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import { FaGithub } from "react-icons/fa";
import bedhost_api_url from "./const";


export default function Header() {

    return (
        <Navbar className="header" bg="dark" variant="dark">
            <Navbar.Brand style={{ marginLeft: "30px" }} href="/#home">
                <img
                    src="/bedbase_logo.svg"
                    height="45px"
                    className="d-inline-block align-top"
                    alt="BEDBASE logo"
                />
            </Navbar.Brand>
            <Nav className="mr-auto">
                <Nav.Link style={{ fontSize: "16px", color: "white" }} href={bedhost_api_url + "/docs"}>
                    <b>API documentation</b>
                </Nav.Link>
            </Nav>
            {/* <Nav className="float-right" >
                <Nav.Link href="https://github.com/databio/bedbase">
                    <FaBook size={30} style={{ fill: 'white' }} />
                </Nav.Link>
            </Nav> */}
            <Nav className="float-right">
                <Nav.Link style={{ marginRight: "30px" }} href="https://github.com/databio/bedbase">
                    <FaGithub size={30} style={{ fill: 'white' }} />
                </Nav.Link>
            </Nav>
        </Navbar>
    )

}