import { Modal } from 'react-bootstrap';
import { useBedMetadata } from '../../queries/useBedMetadata';

type Bed = {
  id: string;
};

type Props = {
  show: boolean;
  setShow: (show: boolean) => void;
  bed: Bed;
};

export const BedMetadataModal = (props: Props) => {
  const { show, setShow, bed } = props;

  const { data: metadata, isFetching: isLoading } = useBedMetadata({
    md5: bed.id,
    autoRun: true,
  });

  return (
    <Modal
      animation={false}
      show={show}
      onHide={() => setShow(false)}
      size='xl'
      aria-labelledby='contained-modal-title-vcenter'
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Metadata for {metadata?.name || bed.id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div>
            <pre>{JSON.stringify(metadata, null, 2)}</pre>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};
