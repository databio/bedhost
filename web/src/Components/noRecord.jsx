import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";

export default function noRecord(props) {
    const [type, setType] = React.useState(props.type);
    const [md5sum, setMd5sum] = React.useState(props.md5sum);

    return (
        <div className="conten-body">
            <Container style={{ width: "75%" }} fluid className="p-4">
                {
                    type === "bed" ? (<h1 style={{ color: "#e76f51" }} >BED file "{md5sum}" does not exist. </h1>
                    ) : (
                        <h1 style={{ color: "#e76f51" }} >BED set "{md5sum}" does not exsit. </h1>
                    )
                }
            </Container>
        </div>
    );
}
