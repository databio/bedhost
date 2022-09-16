import React from "react";
import Modal from 'react-bootstrap/Modal'

export default function ModalImage(props) {
  const [show, setShow] = React.useState(false);
  const [png, setPng] = React.useState(props.image.src_png);
  const [pdf, setPdf] = React.useState(props.image.src_pdf);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const onError = () => {
    setPdf(`/ui/fignotavl.svg`)
    setPng(`/ui/fignotavl_png.svg`)
  };

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
      >
        <Modal.Header closeButton>
          <Modal.Title>{props.image.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body><iframe title="pdf" style={{ margin: 'auto', display: 'block', height: 700, width: 900, overflow: "auto" }} src={pdf}></iframe></Modal.Body>
        <Modal.Footer>
          <button className='btn btn-sm my-btn' onClick={handleClose}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
