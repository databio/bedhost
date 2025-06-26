import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { MetricPlot, MetricPlotType } from '../metrics/metric-plot';

type Props = {
  title: string;
  type: MetricPlotType,
  data: [string, number][];
  median?: number;
  xlab?: string;
  ylab?: string;
  height?: number;
  color?: number;
  angle?: boolean;
  show: boolean;
  onHide: () => void;
};

export const MetricModal = (props: Props) => {
  const { title, type, data, median, xlab, ylab, height, color, angle, show, onHide } = props;
  const [plotType, setPlotType] = useState(type);

  const checkHandler = (value: MetricPlotType) => {
    setPlotType(value);
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
          median={median}
          xlab={xlab}
          ylab={ylab}
          height={height}
          color={color}
          angle={angle}
        />
        </div>
        
      </Modal.Body>
      <Modal.Footer className='d-flex justify-content-between'>
        <select 
          className="form-select w-auto ms-auto" 
          aria-label="Plot Type" 
          onChange={(e) => checkHandler(e.target.value as MetricPlotType)}
          value={plotType}
        >
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
        </select>
        <button onClick={() => onHide()} className='btn btn-primary'>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};
