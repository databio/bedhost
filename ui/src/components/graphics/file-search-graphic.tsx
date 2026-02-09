import { useState } from 'react';

export const FileSearchGraphic = () => {
  const [hoveredFile, setHoveredFile] = useState<number | null>(null);

  return (
    <div className="position-relative w-100 h-100 d-flex align-items-center justify-content-center overflow-hidden" style={{ background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)' }}>
      <svg
        viewBox="0 0 400 220"
        className="w-100 h-100"
        style={{ maxHeight: '220px' }}
      >
        <defs>
          {/* Gradient for lines */}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#008080" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#008080" stopOpacity="0.1" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Main file with contents */}
        <g>
          {/* File container - wider and taller, positioned so top is cut off */}
          <rect
            x="50"
            y="-30"
            width="300"
            height="150"
            rx="6"
            fill="white"
            stroke="#008080"
            strokeWidth="2"
            filter="url(#glow)"
          />

          {/* BED file content - 3 columns: chr | start | end */}
          {[
            { y: -10, o: 0.4, w2: 55, w3: 60 },
            { y: 0, o: 0.3, w2: 45, w3: 70 },
            { y: 10, o: 0.4, w2: 60, w3: 55 },
            { y: 20, o: 0.3, w2: 50, w3: 65 },
            { y: 30, o: 0.4, w2: 55, w3: 60 },
            { y: 40, o: 0.3, w2: 45, w3: 70 },
            { y: 50, o: 0.4, w2: 60, w3: 55 },
            { y: 60, o: 0.3, w2: 50, w3: 65 },
            { y: 70, o: 0.4, w2: 55, w3: 60 },
            { y: 80, o: 0.3, w2: 45, w3: 70 },
            { y: 90, o: 0.4, w2: 60, w3: 55 },
            { y: 100, o: 0.3, w2: 50, w3: 65 },
          ].map((row, i) => (
            <g key={i}>
              <rect x="70" y={row.y} width="30" height="3" rx="1.5" fill="#008080" opacity={row.o}/>
              <rect x="115" y={row.y} width={row.w2} height="3" rx="1.5" fill="#008080" opacity={row.o}/>
              <rect x="190" y={row.y} width={row.w3} height="3" rx="1.5" fill="#008080" opacity={row.o}/>
            </g>
          ))}
          <text x="335" y="103" fontSize="11" fill="#008080" opacity="0.5" textAnchor="end" fontFamily="monospace">.bed</text>
        </g>

        {/* Connecting lines from document to files */}
        <g>
          {/* Line to file 1 - from left side of document */}
          <polyline
            points="120,95 120,130 100,130 100,150"
            fill="none"
            stroke={hoveredFile === 1 ? "#008080" : "#6c757d"}
            strokeWidth="2"
            strokeDasharray="5,5"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {/* {hoveredFile === 1 && (
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-10"
                dur="1s"
                repeatCount="indefinite"
              />
            )} */}
          </polyline>

          {/* Line to file 2 */}
          <polyline
            points="170,50 170,130 150,130 150,150"
            fill="none"
            stroke={hoveredFile === 2 ? "#008080" : "#6c757d"}
            strokeWidth="2"
            strokeDasharray="5,5"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {/* {hoveredFile === 2 && (
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-10"
                dur="1s"
                repeatCount="indefinite"
              />
            )} */}
          </polyline>

          {/* Line to file 5 - from right side of document */}
          <polyline
            points="250,60 250,130 300,130 300,150"
            fill="none"
            stroke={hoveredFile === 5 ? "#008080" : "#6c757d"}
            strokeWidth="2"
            strokeDasharray="5,5"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {/* {hoveredFile === 5 && (
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-10"
                dur="1s"
                repeatCount="indefinite"
              />
            )} */}
          </polyline>
        </g>

        {/* Grid of file icons */}
        <g>
          {/* Small file icons with 3-column BED content */}
          {[
            { x: 85, id: 1, highlight: true },
            { x: 135, id: 2, highlight: true },
            { x: 185, id: 3, highlight: false },
            { x: 235, id: 4, highlight: false },
            { x: 285, id: 5, highlight: true },
          ].map((file) => {
            const hovered = hoveredFile === file.id;
            const color = hovered
              ? (file.highlight ? "#008080" : "#495057")
              : "#6c757d";
            return (
              <g
                key={file.id}
                transform={`translate(${file.x}, 150)`}
                onMouseEnter={() => setHoveredFile(file.id)}
                onMouseLeave={() => setHoveredFile(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect x="0" y="0" width="30" height="40" rx="4" fill="white" stroke={hovered ? (file.highlight ? "#008080" : "#495057") : "#6c757d"} strokeWidth="1.5"/>
                {[8, 14, 20, 26].map((y) => (
                  <g key={y}>
                    <rect x="4" y={y} width="5" height="2" rx="1" fill={color} opacity="0.4"/>
                    <rect x="11" y={y} width="7" height="2" rx="1" fill={color} opacity="0.3"/>
                    <rect x="20" y={y} width="6" height="2" rx="1" fill={color} opacity="0.3"/>
                  </g>
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
