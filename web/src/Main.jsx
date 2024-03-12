import React, { useState, useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Navbar, Nav, Form, FormControl } from "react-bootstrap";
import { BsFillInboxesFill, BsFillInfoCircleFill } from "react-icons/bs";
import { FaCode, FaGithub } from "react-icons/fa";
import { Home, About, Search, BedSplash, BedSetSplash, CreateBedSet } from "./Pages";
import { VersionsSpan } from "./Components";
import bedhost_api_url from "./const/server";

export default function Main() {
    const navigate = useNavigate();
    const [searchTerms, setSearchTerms] = useState("");

    const handleSearchInput = (e) => {
        setSearchTerms(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        if (e.key === "Enter") {
            if (searchTerms) {
                e.preventDefault();
                navigate(`/search?terms=${searchTerms}`);
            } else {
                alert("Please enter some search text!");
            }
        }
    };

    return (
        <React.StrictMode>
            <Navbar style={{ backgroundColor: "#EFF3F6" }}>
                <Nav
                    className="container-fluid "
                    style={{
                        marginLeft: "90px",
                        marginRight: "90px",
                    }}
                >
                    <Navbar.Brand href="/">
                        <img
                            src="/bedbase_logo.svg"
                            height="60px"
                            alt="BEDBASE logo"
                        />
                    </Navbar.Brand>

                    <Nav className="float-right">
                        {(navigate.pathname !== "/" && navigate.pathname !== "/search") ? (
                            <Form inline="true">
                                <FormControl
                                    style={{
                                        width: "500px",
                                        marginRight: "50px",
                                    }}
                                    onChange={handleSearchInput}
                                    onKeyDown={handleSearchSubmit}
                                    value={searchTerms}
                                    type="text"
                                    placeholder="Search BEDbase (ex. K562)"
                                    className="mr-sm-2"
                                />
                            </Form>
                        ) : null}

                        <Nav.Link href={`${bedhost_api_url}/docs`}>
                            <h5>
                                <FaCode
                                    size={20}
                                    style={{
                                        fill: "gray",
                                        marginRight: "5px",
                                        marginBottom: "5px",
                                    }}
                                />
                                API docs
                            </h5>
                        </Nav.Link>

                        <Nav.Link href="/createBedSet">
                            <h5>
                                <BsFillInboxesFill
                                    size={20}
                                    style={{
                                        fill: "gray",
                                        marginRight: "5px",
                                        marginBottom: "5px",
                                    }}
                                />
                                BEDset cart
                            </h5>
                        </Nav.Link>

                        <Nav.Link href="https://github.com/databio/bedbase">
                            <h5>
                                <FaGithub
                                    size={20}
                                    style={{
                                        fill: "gray",
                                        marginRight: "5px",
                                        marginBottom: "5px",
                                    }}
                                />
                                GitHub
                            </h5>
                        </Nav.Link>

                        <Nav.Link href="/About">
                            <h5>
                                <BsFillInfoCircleFill
                                    size={20}
                                    style={{
                                        fill: "gray",
                                        marginRight: "5px",
                                        marginBottom: "5px",
                                    }}
                                />
                                About
                            </h5>
                        </Nav.Link>
                    </Nav>
                </Nav>
            </Navbar>
            <main>
                <Routes>
                    <Route exact path="/" element={<Home />} />
                    <Route exact path="/about" element={<About />} />
                    <Route exact path="/createBedSet" element={<CreateBedSet />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/bedset/:bedset_md5sum" element={<BedSetSplash />} />
                    <Route path="/bed/:bed_md5sum" element={<BedSplash />} />
                </Routes>
            </main>
            <VersionsSpan />
        </React.StrictMode>
    );
}


