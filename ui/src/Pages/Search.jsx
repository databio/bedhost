import React from "react";
import { Container } from "react-bootstrap";
import { StringSearch } from "../Components";
import "../style/search.css";

export default function SearchPage(props) {
    return (
        <>
            <div className="conten-body">
                <Container style={{ width: "75%" }} fluid className="p-4">
                    <StringSearch />
                </Container>
            </div>
        </>
    );
}
