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

          {/* File content lines - more lines distributed throughout */}
          <rect x="70" y="-10" width="260" height="3" rx="1.5" fill="#008080" opacity="0.4"/>
          <rect x="70" y="0" width="200" height="3" rx="1.5" fill="#008080" opacity="0.3"/>
          <rect x="70" y="10" width="240" height="3" rx="1.5" fill="#008080" opacity="0.4"/>
          <rect x="70" y="20" width="180" height="3" rx="1.5" fill="#008080" opacity="0.3"/>
          <rect x="70" y="30" width="220" height="3" rx="1.5" fill="#008080" opacity="0.4"/>
          <rect x="70" y="40" width="250" height="3" rx="1.5" fill="#008080" opacity="0.3"/>
          <rect x="70" y="50" width="190" height="3" rx="1.5" fill="#008080" opacity="0.4"/>
          <rect x="70" y="60" width="230" height="3" rx="1.5" fill="#008080" opacity="0.3"/>
          <rect x="70" y="70" width="210" height="3" rx="1.5" fill="#008080" opacity="0.4"/>
          <rect x="70" y="80" width="240" height="3" rx="1.5" fill="#008080" opacity="0.3"/>
          <rect x="70" y="90" width="200" height="3" rx="1.5" fill="#008080" opacity="0.4"/>
          <rect x="70" y="100" width="220" height="3" rx="1.5" fill="#008080" opacity="0.3"/>
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
            points="280,60 280,130 300,130 300,150"
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
          {/* File 1 */}
          <g
            transform="translate(85, 150)"
            onMouseEnter={() => setHoveredFile(1)}
            onMouseLeave={() => setHoveredFile(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="0"
              y="0"
              width="30"
              height="40"
              rx="4"
              fill="white"
              stroke={hoveredFile === 1 ? "#008080" : "#6c757d"}
              strokeWidth="1.5"
            />
            <rect x="5" y="8" width="20" height="2" rx="1" fill={hoveredFile === 1 ? "#008080" : "#6c757d"} opacity="0.4"/>
            <rect x="5" y="14" width="15" height="2" rx="1" fill={hoveredFile === 1 ? "#008080" : "#6c757d"} opacity="0.3"/>
            <rect x="5" y="20" width="20" height="2" rx="1" fill={hoveredFile === 1 ? "#008080" : "#6c757d"} opacity="0.4"/>
            <rect x="5" y="26" width="12" height="2" rx="1" fill={hoveredFile === 1 ? "#008080" : "#6c757d"} opacity="0.3"/>
          </g>

          {/* File 2 */}
          <g
            transform="translate(135, 150)"
            onMouseEnter={() => setHoveredFile(2)}
            onMouseLeave={() => setHoveredFile(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="0"
              y="0"
              width="30"
              height="40"
              rx="4"
              fill="white"
              stroke={hoveredFile === 2 ? "#008080" : "#6c757d"}
              strokeWidth="1.5"
            />
            <rect x="5" y="8" width="20" height="2" rx="1" fill={hoveredFile === 2 ? "#008080" : "#6c757d"} opacity="0.4"/>
            <rect x="5" y="14" width="15" height="2" rx="1" fill={hoveredFile === 2 ? "#008080" : "#6c757d"} opacity="0.3"/>
            <rect x="5" y="20" width="20" height="2" rx="1" fill={hoveredFile === 2 ? "#008080" : "#6c757d"} opacity="0.4"/>
            <rect x="5" y="26" width="12" height="2" rx="1" fill={hoveredFile === 2 ? "#008080" : "#6c757d"} opacity="0.3"/>
          </g>

          {/* File 3 - no line, no interaction */}
          <g transform="translate(185, 150)"
            onMouseEnter={() => setHoveredFile(3)}
            onMouseLeave={() => setHoveredFile(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="0"
              y="0"
              width="30"
              height="40"
              rx="4"
              fill="white"
              stroke={hoveredFile === 3 ? "#495057" : "#6c757d"}
              strokeWidth="1.5"
            />
            <rect x="5" y="8" width="20" height="2" rx="1" fill={hoveredFile === 3 ? "#495057" : "#6c757d"} opacity="0.4"/>
            <rect x="5" y="14" width="15" height="2" rx="1" fill={hoveredFile === 3 ? "#495057" : "#6c757d"} opacity="0.3"/>
            <rect x="5" y="20" width="20" height="2" rx="1" fill={hoveredFile === 3 ? "#495057" : "#6c757d"} opacity="0.4"/>
            <rect x="5" y="26" width="12" height="2" rx="1" fill={hoveredFile === 3 ? "#495057" : "#6c757d"} opacity="0.3"/>
          </g>

          {/* File 4 - no line, no interaction */}
          <g transform="translate(235, 150)"
            onMouseEnter={() => setHoveredFile(4)}
            onMouseLeave={() => setHoveredFile(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="0"
              y="0"
              width="30"
              height="40"
              rx="4"
              fill="white"
              stroke={hoveredFile === 4 ? "#495057" : "#6c757d"}
              strokeWidth="1.5"
            />
            <rect x="5" y="8" width="20" height="2" rx="1" fill={hoveredFile === 4 ? "#495057" : "#6c757d"} opacity="0.4"/>
            <rect x="5" y="14" width="15" height="2" rx="1" fill={hoveredFile === 4 ? "#495057" : "#6c757d"} opacity="0.3"/>
            <rect x="5" y="20" width="20" height="2" rx="1" fill={hoveredFile === 4 ? "#495057" : "#6c757d"} opacity="0.4"/>
            <rect x="5" y="26" width="12" height="2" rx="1" fill={hoveredFile === 4 ? "#495057" : "#6c757d"} opacity="0.3"/>
          </g>

          {/* File 5 */}
          <g
            transform="translate(285, 150)"
            onMouseEnter={() => setHoveredFile(5)}
            onMouseLeave={() => setHoveredFile(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="0"
              y="0"
              width="30"
              height="40"
              rx="4"
              fill="white"
              stroke={hoveredFile === 5 ? "#008080" : "#6c757d"}
              strokeWidth="1.5"
            />
            <rect x="5" y="8" width="20" height="2" rx="1" fill={hoveredFile === 5 ? "#008080" : "#6c757d"} opacity="0.4"/>
            <rect x="5" y="14" width="15" height="2" rx="1" fill={hoveredFile === 5 ? "#008080" : "#6c757d"} opacity="0.3"/>
            <rect x="5" y="20" width="20" height="2" rx="1" fill={hoveredFile === 5 ? "#008080" : "#6c757d"} opacity="0.4"/>
            <rect x="5" y="26" width="12" height="2" rx="1" fill={hoveredFile === 5 ? "#008080" : "#6c757d"} opacity="0.3"/>
          </g>
        </g>
      </svg>
    </div>
  );
};
