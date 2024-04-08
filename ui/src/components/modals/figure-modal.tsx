import { Modal } from 'react-bootstrap';

type Props = {
  title: string;
  src: string;
  alt: string;
  show: boolean;
  onHide: () => void;
};

export const FigureModal = (props: Props) => {
  const { title, src, alt, show, onHide } = props;
  return (
    <Modal
      animation={false}
      show={show}
      onHide={() => onHide()}
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
        <button
          className="btn btn-outline-primary"
          onClick={() => {
            const link = document.createElement('a');
            link.href = src;
            link.download = alt;
            link.click();
          }}
        >
          <i className="bi bi-download me2"></i> Download
        </button>
        <button onClick={() => onHide()} className="btn btn-primary">
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};
