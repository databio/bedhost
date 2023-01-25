import React from "react";
import { Route, Switch, withRouter } from "react-router-dom";
import { Navbar, Nav, Form, FormControl } from "react-bootstrap";
import { BsFillInboxesFill, BsFillInfoCircleFill } from "react-icons/bs";
import { FaCode, FaGithub } from "react-icons/fa"
import { Home, About, Search, BedSplash, BedSetSplash, CreateBedSet } from "./Pages";
import { VersionsSpan } from "./Components";
import { client } from "./const/server";
import { ApolloProvider } from "@apollo/client";
import bedhost_api_url from "./const/server";

class Main extends React.Component {
    state = {
        searchTerms: ""
    };

    handleRoute = route => () => {
        this.props.history.push({ pathname: route });
    };

    handleSearchInput = (e) => {
        this.setState({
            searchTerms: e.target.value
        });
    };

    handleSearchSubmit = (e) => {
        if (e.key === 'Enter') {
            if (this.state.searchTerms) {
                e.preventDefault();
                this.props.history.push({
                    pathname: `/search`,
                    search: "?" + new URLSearchParams(`terms=${this.state.searchTerms}`)
                });
            } else {
                alert("Please enter some search text!");
            }
        }
    };

    render() {
        return (
            <ApolloProvider client={client}>
                <React.StrictMode>

                    <Navbar style={{ backgroundColor: "#EFF3F6" }} >
                        <Nav
                            className="container-fluid "
                            style={{
                                marginLeft: "90px",
                                marginRight: "90px"
                            }}
                        >
                            <Navbar.Brand href="/">
                                <img
                                    src="/bedbase_logo.svg"
                                    // src="/ui/bedbase_logo.svg"
                                    height="60px"
                                    alt="BEDBASE logo"
                                />
                            </Navbar.Brand>

                            <Nav className="float-right" >
                                <Form inline >
                                    <FormControl
                                        style={{
                                            width: "300px",
                                            marginRight: "50px"
                                        }}
                                        onChange={this.handleSearchInput.bind(this)}
                                        onKeyDown={this.handleSearchSubmit.bind(this)}
                                        value={this.state.searchTerms}
                                        type="text"
                                        placeholder="Search BEDbase (ex. K562)"
                                        className="mr-sm-2"
                                    />
                                </Form>
                                <Nav.Link href={`${bedhost_api_url}/docs`}>
                                    <h5>
                                        <FaCode
                                            size={20}
                                            style={{
                                                fill: "gray",
                                                marginRight: "5px",
                                                marginBottom: "5px"
                                            }}
                                        />
                                        API docs
                                    </h5>
                                </Nav.Link>

                                {/* <Nav.Link href={`${bedhost_api_url}/graphql`}>
                                    <h5>
                                        <FaCode
                                            size={20}
                                            style={{ 
                                                fill: "gray", 
                                                marginRight: "5px", 
                                                marginBottom: "5px" 
                                            }}
                                        />
                                        GraphiQL
                                    </h5>
                                </Nav.Link> */}

                                <Nav.Link onClick={this.handleRoute("/createBedSet")}>
                                    <h5>
                                        <BsFillInboxesFill
                                            size={20}
                                            style={{
                                                fill: "gray",
                                                marginRight: "5px",
                                                marginBottom: "5px"
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
                                                marginBottom: "5px"
                                            }}
                                        />
                                        GitHub
                                    </h5>
                                </Nav.Link>

                                <Nav.Link onClick={this.handleRoute("/about")}>
                                    <h5>
                                        <BsFillInfoCircleFill
                                            size={20}
                                            style={{
                                                fill: "gray",
                                                marginRight: "5px",
                                                marginBottom: "5px"
                                            }}
                                        />
                                        About
                                    </h5>
                                </Nav.Link>
                            </Nav>
                        </Nav>
                    </Navbar>
                    <main >
                        <Switch>
                            <Route exact path="/" component={Home} />
                            <Route exact path="/about" component={About} />
                            <Route exact path="/createBedSet" component={CreateBedSet} />
                            <Route path="/search" component={Search} />
                            <Route path="/bedsetsplash/:bedset_md5sum" component={BedSetSplash} />
                            <Route path="/bedsplash/:bed_md5sum" component={BedSplash} />
                        </Switch>
                    </main>
                    <VersionsSpan />
                </React.StrictMode>
            </ApolloProvider >
        );
    }
}

export default withRouter(Main);
