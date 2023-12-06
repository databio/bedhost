import React, { useState, useEffect } from "react";
import ModalImage from "./modalImage";


export default function BedSetPlots({ bedset_figs }) {
    const [image, setImage] = useState(null);

    useEffect(() => {
        if (bedset_figs && bedset_figs.length > 0) {
            setImage(bedset_figs[0]);
        }
    }, [bedset_figs]);

    return (
        <div style={{ marginBottom: "10px" }}>
            <span>Region commonality</span>
            {image && <ModalImage image={image} page="bedset" />}
        </div>
    );
}

