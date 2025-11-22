import { Modal } from 'react-bootstrap';

type Props = {
  titles: string[];
  endpoints: string[];
  show: boolean;
  onHide: () => void;
};

export const EndpointsModal = (props: Props) => {
  const { titles, endpoints, show, onHide } = props;

  return (
    <Modal
      animation={false}
      show={show}
      onHide={() => onHide()}
      size='lg'
      aria-labelledby='contained-modal-title-vcenter'
      centered
    >
      <Modal.Header closeButton>API Endpoints</Modal.Header>
      <Modal.Body>
        <div className='d-flex justify-content-center'>
          <table className='table table-striped border'>
            <thead>
              <tr>
                <th>Service</th>
                <th>Endpoint</th>
              </tr>
            </thead>
            <tbody>
              {titles.map((title, index) => (
                <tr key={index}>
                  <td>{title}</td>
                  <td>
                    <a href={endpoints[index]} target='_blank' rel='noopener noreferrer'>
                      {endpoints[index]}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal.Body>
    </Modal>
  );
};
