import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { FaBook } from "react-icons/fa";
import bedhost_api_url from "./const/server";

export default function Header() {
  return (
    <Navbar
      className="header"
      bg="dark"
      variant="dark"
      style={{ minWidth: "900px" }}
    >
      <Navbar.Brand style={{ marginLeft: "30px" }} href="/">
        <img
          src="/ui/bedbase_logo.svg"
          height="45px"
          className="d-inline-block align-top"
          alt="BEDBASE logo"
        />
      </Navbar.Brand>
      <Nav className="mr-auto">
        <Nav.Link
          style={{ fontSize: "16px", color: "white" }}
          href={bedhost_api_url + "/docs"}
        >
          <b>API documentation</b>
        </Nav.Link>
        <Nav.Link
          style={{ fontSize: "16px", color: "white" }}
          href={bedhost_api_url + "/graphql"}
        >
          <b>GraphiQL</b>
        </Nav.Link>
      </Nav>
      <Nav className="float-right">
        <Link to="/about">
          <FaBook size={30} style={{ fill: "white" }} />
        </Link>
      </Nav>
      <Nav className="float-right">
        <Nav.Link
          style={{ marginRight: "30px" }}
          href="https://github.com/databio/bedbase"
        >
          <FaGithub size={30} style={{ fill: "white" }} />
        </Nav.Link>
      </Nav>
    </Navbar>
  );
}
