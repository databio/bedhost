import React from "react";
import Modal from 'react-bootstrap/Modal'

export default function ModalImage(props) {
  const [show, setShow] = React.useState(false);
  console.log("modal: ", props.image)
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <img
        onClick={handleShow}
        style={{ height: 300, width: 300 }}
        src={props.image.src_png}
        alt={props.image.name}
      />

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{props.image.caption}</Modal.Title>
        </Modal.Header>
        <Modal.Body><iframe src={props.image.src_pdf}></iframe></Modal.Body>
        <Modal.Footer>
          <button variant="secondary" onClick={handleClose}>
            Close
            </button>
          <button variant="primary" onClick={handleClose}>
            Save Changes
            </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
