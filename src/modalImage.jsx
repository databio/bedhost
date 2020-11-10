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
        className='splash-img'
        src={props.image.src_png}
        alt={props.image.name}
      />
      <Modal
        centered
        dialogClassName="custom-modal"
        show={show}
        onHide={handleClose}
      >
        <Modal.Header closeButton>
          <Modal.Title>{props.image.caption}</Modal.Title>
        </Modal.Header>
        <Modal.Body><iframe style={{ height: 650, width: 600 }} src={props.image.src_pdf}></iframe></Modal.Body>
        <Modal.Footer>
          <button className='btn btn-sm my-btn' onClick={handleClose}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
