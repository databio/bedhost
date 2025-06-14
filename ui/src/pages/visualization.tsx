import React, { useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
// import graphData from './output.json';
import { Link } from 'react-router-dom';
import { useUmap } from '../queries/useUmapData';

export interface GraphNode {
  id: string;
  name: string;
  description: string;
  cell_line: string;
  assay?: string;
  x: number;
  y: number;
  z: number;
}

export const Graph3D: React.FC = () => {
  const { data: umap_data, isLoading, error } = useUmap();
  const fgRef = useRef<any>();
  const [searchId, setSearchId] = useState('');
  const [message, setMessage] = useState('');

  if (isLoading) {
    return <div>Loading data...</div>;
  }

  if (error) {
    return <div>Error loading data: {error.message}</div>;
  }

  const graphDataWithoutLinks = {
    nodes: umap_data.nodes.map((node: GraphNode) => ({
      ...node,
      x: node.x,
      y: node.y,
      z: node.z,
    })),
    links: [],
  };

  const handleSearch = () => {
    const node = graphDataWithoutLinks.nodes.find(n => n.id === searchId);
    if (node && fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x, y: node.y, z: node.z + 300 }, // zoom in 300 units away
        node,
        2000, // animate over 2 seconds
      );
      setMessage(`Found: ${node.id}`);

    } else {

      fgRef.current.cameraPosition(
        { x: 0, y: 0, z: 1000 }, // reset to default center position
        { x: 0, y: 0, z: 0 }, // look at the center
        2000, // animate over 2 seconds
      );
      setMessage('BED file not found.');
    }
  };
  return (
    <div>

      <div className="z-1 position-absolute p-1 rounded-3">
        <input
          type="text"
          placeholder="Search bed by ID"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="form-control me-2"
        />
        <div className="z-2 position-absolute p-1 text-white p-3">
          {message && <p className="z-2">{message}</p>}
        </div>
      </div>

      <ForceGraph3D
        ref={fgRef}
        graphData={graphDataWithoutLinks}
        nodeLabel={(node: GraphNode) => (
          `<div><b>${node.id}</b><br/>cell_line: ${node.cell_line}<br/>assay: ${node.assay}<br/>${node.description}</div>`
        )}
        nodeAutoColorBy="cell_line"
        nodeRelSize={60}
        enableNodeDrag={false}
        onNodeClick={(node: GraphNode) => {
          if (node.id) {
            // const url = `https://bedbase.org/bed/${node.id}`;
            // window.open(url, '_blank');
            // navigator.clipboard.writeText(url).catch(console.error);
            setSearchId(node.id);
            handleSearch();
            setMessage(`Clicked on: ${node.id} \n ${node.cell_line} <\n  ${node.assay}`);
          }
        }}
      />
      <div className="position-absolute bottom-0 start-0">
        <Link to="/">
          <img
            src="/bedbase_logo.svg"
            alt="BEDbase Logo"
            className="img-fluid umap-bedbase-icon-size"
          />
        </Link>

      </div>
    </div>

  );
};