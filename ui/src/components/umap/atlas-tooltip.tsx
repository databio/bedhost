import { createRoot, Root } from 'react-dom/client';

interface TooltipProps {
  tooltip?: {
    text: string;
    identifier: string;
    fields?: {
      Assay: string;
      'Cell Line': string;
      Description: string;
    };
    category?: number;
    x?: number;
    y?: number;
  };
  showLink?: boolean;
}

const TooltipContent = ({ tooltip }: { tooltip: TooltipProps['tooltip']; showLink?: boolean }) => {
  if (!tooltip) return null;
  return (
    <div
      className='border rounded text-xs overflow-hidden'
      style={{
        maxWidth: '300px',
        pointerEvents: 'none',
        backdropFilter: 'blur(8px)',
        backgroundColor: '#ffffff88',
      }}
    >
      <div className='p-2'>
        <div className='fw-bold mb-1'>{tooltip.text || 'Unnamed BED'}</div>
        {tooltip.fields && (
          <>
            <p className='text-muted fst-italic mb-2'>{tooltip.fields.Description || 'No description available'}</p>
            <div className='d-flex flex-wrap gap-1'>
              {tooltip.identifier !== 'custom_point' && (
                <>
                  <span className='text-muted badge border fw-medium text-bg-light' style={{ fontSize: '10px' }}>
                    <span className='text-body-tertiary'>cell_line:</span> {tooltip.fields['Cell Line'] || 'N/A'}
                  </span>
                  <span className='text-muted badge border fw-medium text-bg-light' style={{ fontSize: '10px' }}>
                    <span className='text-body-tertiary'>assay:</span> {tooltip.fields.Assay || 'N/A'}
                  </span>
                  <span className='text-muted badge border fw-medium text-bg-light' style={{ fontSize: '10px' }}>
                    <span className='text-body-tertiary'>id:</span> {tooltip.identifier || 'N/A'}
                  </span>
                </>
              )}
              <span className='text-muted badge border fw-medium text-bg-light' style={{ fontSize: '10px' }}>
                <span className='text-body-tertiary'>x:</span> {tooltip.x ? tooltip.x.toFixed(6) : 'N/A'}
              </span>
              <span className='text-muted badge border fw-medium text-bg-light' style={{ fontSize: '10px' }}>
                <span className='text-body-tertiary'>y:</span> {tooltip.y ? tooltip.y.toFixed(6) : 'N/A'}
              </span>
            </div>
          </>
        )}
        {/*{showLink && tooltip.identifier !== 'custom_point' && (*/}
        {/*  <a*/}
        {/*    href={`/bed/${tooltip.identifier}`}*/}
        {/*    className='btn btn-xs btn-primary mt-2'*/}
        {/*    style={{ pointerEvents: 'auto' }}*/}
        {/*  >*/}
        {/*    Go!*/}
        {/*  </a>*/}
        {/*)}*/}
      </div>
    </div>
  );
};

export class AtlasTooltip {
  private root: Root;
  private showLink: boolean;

  constructor(target: HTMLElement, props: TooltipProps) {
    // Create a React root and render your component
    this.root = createRoot(target);
    this.showLink = props.showLink || false;
    this.update(props);
  }

  update(props: TooltipProps) {
    // Re-render with new props
    this.root.render(<TooltipContent tooltip={props.tooltip} showLink={this.showLink} />);
  }

  destroy() {
    // Unmount the React component
    this.root.unmount();
  }
}
