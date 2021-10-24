import React from "react";
import Modal from 'react-bootstrap/Modal'

export default function ModalImage(props) {
  const [show, setShow] = React.useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <img
        onClick={handleShow}
        className={ (props.page === "bed") ? "splash-img-bed" : "splash-img-bedset"}
        src={props.image.src_png}
        alt={props.image.id}
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
        <Modal.Body><iframe title="pdf" style={{ margin: 'auto', display:'block', height: 950, width: 900 }} src={props.image.src_pdf}></iframe></Modal.Body>
        <Modal.Footer>
          <button className='btn btn-sm my-btn' onClick={handleClose}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
