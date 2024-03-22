import { Card } from 'react-bootstrap';
import { components } from '../../../bedbase-types';
import { makeHttpDownloadLink, makeS3DownloadLink } from '../../utils';

type Props = {
  metadata: components['schemas']['BedMetadata'];
};

export const BedDownload = (props: Props) => {
  const { metadata } = props;
  return (
    <Card>
      <Card.Header>Downloads</Card.Header>
      <Card.Body>
        <div className="d-flex flex-column">
          <div>
            <a href={makeHttpDownloadLink(metadata!.id)}>http</a> | <a href={makeS3DownloadLink(metadata!.id)}>s3</a> :
            BED File ({metadata.files?.bigbedfile?.size || 'unknown'})
          </div>
          {metadata.files?.bigbedfile && (
            <div>
              <a href={makeHttpDownloadLink(metadata?.files.bigbedfile.path)}>http</a> |{' '}
              <a href={makeS3DownloadLink(metadata?.files.bigbedfile.path)}>s3</a> : BigBedFile (
              {metadata.files.bigbedfile.size || 'unknown'})
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};
