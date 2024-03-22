import { Modal } from 'react-bootstrap';

type Props = {
  title: string;
  src: string;
  alt: string;
  show: boolean;
  setShow: (show: boolean) => void;
};

export const FigureModal = (props: Props) => {
  const { title, src, alt, show, setShow } = props;
  return (
    <Modal
      animation={false}
      show={show}
      onHide={() => setShow(false)}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>{title}</Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-column align-items-center">
          <img height="600px" src={src} alt={alt} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-outline-primary">
          <i className="bi bi-download me2"></i> Download
        </button>
        <button className="btn btn-primary" onClick={() => setShow(false)}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};
