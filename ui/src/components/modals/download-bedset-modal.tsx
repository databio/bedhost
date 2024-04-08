import { useCopyToClipboard } from '@uidotdev/usehooks';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import rehypeHighlight from 'rehype-highlight';
import { generateDownloadBedSetScriptMd } from '../../utils';
import Markdown from 'react-markdown';

type Props = {
  id: string;
  show: boolean;
  setShow: (show: boolean) => void;
};

export const DownloadBedSetModal = (props: Props) => {
  const { id, show, setShow } = props;

  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  return (
    <Modal
      animation={false}
      show={show}
      onHide={() => setShow(false)}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Download BEDset</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="position-relative p-2">
          <Markdown rehypePlugins={[rehypeHighlight]}>{generateDownloadBedSetScriptMd(id)}</Markdown>
        </div>
        <div className="position-absolute top-0 end-0">
          <button
            className="btn btn-sm btn-primary mt-2 me-2"
            onClick={() => {
              copyToClipboard(`
                from geniml.bbclient import bbclient

                bbclient.load_bedset('${id}')
              `);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <i className="bi bi-clipboard me-2"></i>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
