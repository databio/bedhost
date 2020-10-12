import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import { FaGithub, FaBook } from "react-icons/fa";


export default function Header() {

    return (
        <Navbar bg="dark" variant="dark">
            <Navbar.Brand href="#home">
                <img
                    src="/bedbase_logo.svg"
                    width="200"
                    height="30"
                    className="d-inline-block align-top"
                    alt="BEDBASE logo"
                />
            </Navbar.Brand>
            <Nav className="mr-auto">
                <Nav.Link href="http://localhost:8000/docs">API documentation</Nav.Link>
            </Nav>
            {/* <Nav className="float-right" >
                <Nav.Link href="https://github.com/databio/bedbase">
                    <FaBook size={30} style={{ fill: 'white' }} />
                </Nav.Link>
            </Nav> */}
            <Nav className="float-right">
                <Nav.Link href="https://github.com/databio/bedbase">
                    <FaGithub size={30} style={{ fill: 'white' }} />
                </Nav.Link>
            </Nav>
        </Navbar>
    )

}