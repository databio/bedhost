import { useCopyToClipboard } from '@uidotdev/usehooks';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import Markdown from 'react-markdown';
import { generateCurlScriptForCartDownloadMd, generateCurlScriptForCartDownloadRaw } from '../../utils';
import { useBedCart } from '../../contexts/bedcart-context';
import rehypeHighlight from 'rehype-highlight';

type Props = {
  show: boolean;
  setShow: (show: boolean) => void;
};

export const DownloadCartModal = (props: Props) => {
  const { show, setShow } = props;
  const { cart } = useBedCart();
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);
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
        <Modal.Title>Download cart</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='position-relative p-2'>
          <Markdown rehypePlugins={[rehypeHighlight]}>
            {generateCurlScriptForCartDownloadMd(Object.values(cart).map((item) => item.id))}
          </Markdown>
        </div>
        <div className='position-absolute top-0 end-0'>
          <button
            className='btn btn-sm btn-primary mt-2 me-2'
            onClick={() => {
              copyToClipboard(generateCurlScriptForCartDownloadRaw(Object.values(cart).map((item) => item.id)));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <i className='bi bi-clipboard me-2'></i>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
