import { components } from '../../../bedbase-types';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import {useState} from "react";

type SearchResponse = components['schemas']['BedSetListResult'];

type Props = {
    results: SearchResponse;
};

export const SearchBedSetResultTable = (props: Props) => {
    const { results } = props;
    const [, copyToClipboard] = useCopyToClipboard();
    const [copiedId, setCopiedId] = useState('');

    return (
        <table className="table">
            <thead>
            <tr>
                <th scope="col">Bedset ID</th>
                <th scope="col">Name</th>
                <th scope="col">Description</th>
                <th scope={'col'}>Number of Beds</th>
                <th scope="col" style={{ minWidth: '140px' }}>
                    Actions
                </th>
            </tr>
            </thead>
            <tbody>
            {results.results?.map((result) => (
                <tr key={result.id}>
                    <td>{result?.id || 'Unknown Id'}
                        <button
                            className="btn btn-link text-primary mb-2"
                            onClick={() => {
                                copyToClipboard(result?.id || '');
                                setCopiedId(result?.id);
                                setTimeout(() => {
                                    setCopiedId('');
                                }, 1000);
                            }}
                        >
                            {copiedId === result.id ? <i className="bi bi-check me-1"/> : <i className="bi bi-clipboard me-1"/>}
                        </button>
                    </td>
                    <td>{result?.name || 'Unknown Name'}</td>
                    <td>{result?.description || 'Unknown Description'}</td>
                    <td>{result?.bed_ids?.length || 0}</td>
                    <td>
                        <a className="me-1 align-content-center" href={`/bedset/${result?.id}`}>
                            <button className="btn btn-sm btn-outline-primary">
                                <i className="bi bi-eye"></i>
                            </button>
                        </a>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
};
