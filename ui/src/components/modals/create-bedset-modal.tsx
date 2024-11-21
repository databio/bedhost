import { useCopyToClipboard } from '@uidotdev/usehooks';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import Markdown from 'react-markdown';
import { generateBEDsetPEPMd, generateBEDsetPEPDownloadRaw } from '../../utils';
import { useBedCart } from '../../contexts/bedcart-context';
import rehypeHighlight from 'rehype-highlight';

type Props = {
  show: boolean;
  setShow: (show: boolean) => void;
};

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const generateBEDsetCreationDescription = () => {
  const text = `
  To create new BEDset follow these steps:

  1. Create PEP in [PEPhub](https://pephub.databio.org/), by copying the text below, and pasting it into the sample table.
  The name of the PEP project will be used as the name and identifier for the BEDset.
  2. Add source, author, and other metadata to config file. e.g. 
  \`\`\`json
  'author': "BEDbase team",
  'source': "BEDbase",
  \`\`\`
  3. Go to the BEDbase API ([${API_BASE}](${API_BASE}/docs#/bedset/create_bedset_v1_bedset_create__post)) and 
  create a new BEDset by providing the registry path in the Body of the request. (Registry path can be copied from the PEPhub):
  \`\`\`json
  {
    "registry_path": "namespace/name:tag"
  }
  \`\`\`
  
  
  
  \** At this point we support only PEPs from bedbase organization.
  `;
  return text;
};

export const CreateBedSetModal = (props: Props) => {
  const { show, setShow } = props;
  const { cart } = useBedCart();
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);
  return (
    <Modal
      animation={false}
      show={show}
      onHide={() => setShow(false)}
      size="xl"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header>
        <button
          type="button"
          className="btn-close position-absolute top-0 end-0 m-2"
          aria-label="Close"
          onClick={() => setShow(false)}
        ></button>
        <div className="w-100">
          <Modal.Title>Create BEDset</Modal.Title>
          <Markdown className="" rehypePlugins={[rehypeHighlight]}>
            {generateBEDsetCreationDescription()}
          </Markdown>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="position-relative p-2">
          <Markdown rehypePlugins={[rehypeHighlight]}>{generateBEDsetPEPMd(cart)}</Markdown>
        </div>
        <div className="position-absolute top-0 end-0">
          <button
            className="btn btn-sm btn-primary mt-2 me-2"
            onClick={() => {
              copyToClipboard(generateBEDsetPEPDownloadRaw(cart));
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
