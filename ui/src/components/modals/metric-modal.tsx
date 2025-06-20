import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { MetricPlot, MetricPlotType } from '../metrics/metric-plot';
import { useRef } from 'react';

type Props = {
  title: string;
  type: MetricPlotType,
  data: [string, number][];
  xlab?: string;
  ylab?: string;
  height?: number;
  show: boolean;
  onHide: () => void;
};

export const MetricModal = (props: Props) => {
  const { title, type, data, xlab, ylab, height, show, onHide } = props;
  const plotRef = useRef<{ toBase64Image: () => string } | null>(null);

  const [plotType, setPlotType] = useState(type);

  const checkHandler = (value: MetricPlotType) => {
    setPlotType(value);
  };

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
          type={plotType}
          data={data} 
          xlab={xlab}
          ylab={ylab}
          height={height}
        />
        </div>
        
      </Modal.Body>
      <Modal.Footer className='d-flex justify-content-between'>
        <select 
          className="form-select w-auto me-auto" 
          aria-label="Plot Type" 
          onChange={(e) => checkHandler(e.target.value as MetricPlotType)}
          value={plotType}
        >
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
        </select>
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
