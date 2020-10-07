import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";


export default function Header() {
   
    return(
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
        </Navbar>
    )
    
  }