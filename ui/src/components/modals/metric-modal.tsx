import { Modal } from 'react-bootstrap';
import { MetricPlot } from '../metrics/metric-plot';
import { useRef } from 'react';

type Props = {
  title: string;
  type: string,
  data: [string, number][];
  dataLabel?: string;
  backgroundColor: string[];
  borderWidth: number;
  sliceIndex: number;
  show: boolean;
  onHide: () => void;
};

export const MetricModal = (props: Props) => {
  const { title, type, data, dataLabel, backgroundColor, borderWidth, sliceIndex, show, onHide } = props;
  const plotRef = useRef<{ toBase64Image: () => string } | null>(null);

  const handleDownload = () => {
    if (plotRef.current) {
      const link = document.createElement('a');
      link.download = (props.title ? props.title : 'metric_plot') + '.png';
      link.href = plotRef.current.toBase64Image();
      link.click();
    }
  };

  return (
    <Modal
      animation={false}
      show={show}
      onHide={() => onHide()}
      size='lg'
      aria-labelledby='contained-modal-title-vcenter'
      centered
    >
      <Modal.Header closeButton>{title}</Modal.Header>
      <Modal.Body>
        <div className='d-flex justify-content-center' style={{maxHeight: '500px'}}>
        <MetricPlot 
          type={type}
          data={data} 
          dataLabel={dataLabel}
          backgroundColor={backgroundColor} 
          borderWidth={borderWidth} 
          sliceIndex={sliceIndex}
          plotRef={plotRef}
        />
        </div>
        
      </Modal.Body>
      <Modal.Footer>
        <button
          className='btn btn-outline-primary'
          onClick={handleDownload}
          disabled={false}
        >
          <i className='bi bi-download me-1'></i> Download PNG
        </button>
        <button onClick={() => onHide()} className='btn btn-primary'>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};
