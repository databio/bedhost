import React from "react";
import Modal from 'react-bootstrap/Modal'
import axios from "axios";
import bedhost_api_url from "../const/server";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default function ModalImage(props) {
  const [show, setShow] = React.useState(false);
  const [png, setPng] = React.useState(props.image.src_png);
  const [pdf, setPdf] = React.useState(props.image.src_pdf);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const onError = () => {
    setPdf(`/fignotavl.svg`)
    setPng(`/fignotavl_png.svg`)
  };

  // React.useEffect(() => {
  //   const getUrls = async () => {
  //     try {
  //       const pdfapi = props.image.src_pdf.replace("/bytes", "");
  //       const pdfurl = await api.get(pdfapi).then(({ data }) => data)
  //       const pngurl = pdfurl.replace(".pdf", ".png");

  //       // setPdf(pdfurl)
  //       setPng(pngurl)
  //     } catch (error) {
  //       console.log("error:", error)
  //       setPdf(`/fignotavl.svg`)
  //       setPng(`/fignotavl_png.svg`)
  //     }
  //   };

  //   getUrls();
  // }, []);

  return (
    <>
      <img
        onClick={handleShow}
        className={(props.page === "bed") ? "splash-img-bed" : "splash-img-bedset"}
        src={png}
        alt={props.image.id}
        onError={onError}
      />
      <Modal
        centered
        dialogClassName="custom-modal"
        show={show}
        onHide={handleClose}
        size="xl"
      >
        <Modal.Header >
          <Modal.Title>{props.image.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: 800, width: 1000 }}>
          <iframe title="pdf" frame_border="0" style={{ height: "100%", width: "100%", overflow: "auto" }} src={pdf}></iframe>
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-sm btn-search' onClick={handleClose}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
