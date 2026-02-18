import { useCopyToClipboard } from '@uidotdev/usehooks';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import Markdown from 'react-markdown';
import { generateBEDsetPEPMd, generateBEDsetPEPDownloadRaw } from '../../utils';
import { useBedCart } from '../../contexts/bedcart-context';
import rehypeHighlight from 'rehype-highlight';
import axios from 'axios';

type Props = {
  show: boolean;
  setShow: (show: boolean) => void;
};

const API_BASE = import.meta.env.VITE_API_BASE || '';
const API_ENDPOINT = `${API_BASE}/bedset/create`;

export const generateBEDsetCreationDescription = () => {
  const text = `
  **To create a new BEDset:**

  1. Create PEP in [PEPhub](https://pephub.databio.org/), by copying the text from **'PEP sample table'** section below, and pasting it into the sample table in PEPhub.
  The name of the PEP project will be used as the name and identifier for the new BEDset.
  2. Add *source*, *author*, and other metadata to config file in PEP. e.g. (not required, but recommended): 
  \`\`\`json
  'author': "BEDbase team",
  'source': "BEDbase",
  \`\`\`
  3. Use **'Submit PEP'** section form below to create a new BEDset by providing the registry path (e.g. databio/new_bedset:default). Registry path can be copied from the PEPhub. \n
     **Optionally, you can use BEDbase API ([${API_BASE}](${API_BASE}/docs#/bedset/create_bedset_v1_bedset_create__post)), where you can provide registry path
   in the Body of the request. Example Body request:* 
  \`\`\`json
  {
    "registry_path": "namespace/name:tag"
  }
  \`\`\`
  ***Note**: We currently only support PEPs from the __bedbase team__. If you want to create new bedset, please create an issue: [https://github.com/databio/bedbase](https://github.com/databio/bedbase/issues)

  `;
  return text;
};

export const CreateBedSetModal = (props: Props) => {
  const { show, setShow } = props;
  const { cart } = useBedCart();
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');

  const handleInputRegistryPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      await axios.post(API_ENDPOINT, { registry_path: inputValue });
      setMessage('Successfully created BEDset!');
    } catch (error) {
      const err = error as Error & { response?: { data?: { detail?: string } } };
      const errorMessage = err.response?.data?.detail || err.message;
      setMessage(`! Unable to create BEDset. ${errorMessage}`);
    }
  };

  return (
    <Modal
      animation={false}
      show={show}
      onHide={() => setShow(false)}
      size='xl'
      aria-labelledby='contained-modal-title-vcenter'
      centered
    >
      <Modal.Header>
        <button
          type='button'
          className='btn-close position-absolute top-0 end-0 m-3 py-1 px-0'
          aria-label='Close'
          onClick={() => setShow(false)}
        ></button>
        <div className='w-100 text-sm'>
          <h1 className='fs-5 mb-1 fw-semibold d-inline'>Create BEDset</h1>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className='w-100 text-sm'>
          <Markdown rehypePlugins={[rehypeHighlight]}>{generateBEDsetCreationDescription()}</Markdown>
        </div>

        <div className='border-bottom my-3' style={{ margin: '0 -1em' }}></div>
        <span className='fw-semibold text-lg'>PEP sample table</span>
        <div className='position-relative my-1 px-3' style={{ margin: '-1em' }}>
          <Markdown className='rounded rounded-2 bg-body-secondary markdown-bg' rehypePlugins={[rehypeHighlight]}>
            {generateBEDsetPEPMd(Object.values(cart).map((item) => item.id))}
          </Markdown>
          <div className='position-absolute top-0 end-0 m-3'>
            <button
              className='btn btn-sm btn-primary me-3'
              onClick={() => {
                copyToClipboard(generateBEDsetPEPDownloadRaw(Object.values(cart).map((item) => item.id)));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <i className='bi bi-clipboard me-2'></i>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className='border-bottom my-3' style={{ margin: '0 -1em' }}></div>

        <div className=''>
          <span className='fw-semibold text-lg'>Submit PEP</span>
          <div className='d-flex align-items-center mt-1'>
            <input
              type='text'
              className='form-control me-2'
              placeholder='Provide a PEPhub registry path.'
              value={inputValue}
              onChange={handleInputRegistryPathChange}
            />
            <button className='btn btn-primary' onClick={handleSubmit}>
              Submit
            </button>
          </div>
          {message && <div className='mt-2'>{message}</div>}
        </div>
      </Modal.Body>
    </Modal>
  );
};
