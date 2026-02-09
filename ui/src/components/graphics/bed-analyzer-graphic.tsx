export const BedAnalyzerGraphic = () => {
  return (
    <div className="position-relative w-100 h-100 d-flex align-items-center overflow-hidden" style={{ background: 'white' }}>
      <svg
        viewBox="0 0 400 220"
        className="w-100 h-100"
        style={{ maxHeight: '220px' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Grid pattern */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e9ecef" strokeWidth="0.5"/>
          </pattern>

          {/* Glow filter */}
          <filter id="glow-analyzer">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Arrowhead marker */}
          <marker
            id="arrowhead"
            markerWidth="24"
            markerHeight="24"
            refX="1"
            refY="12"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L0,24 L18,12 z" fill="#008080"/>
          </marker>
        </defs>

        {/* Grid background - extends beyond viewBox */}
        <rect x="-1000" width="2400" height="220" fill="url(#grid)"/>

        {/* Connecting pipe from left rect bottom to right rect left */}
        <path
          d="M 100 145 L 100 165 L 185 165"
          stroke="#008080"
          strokeWidth="12"
          opacity="0.3"
          fill="none"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          markerEnd="url(#arrowhead)"
        />

        {/* Main input file - cut off from top */}
        <g>
          <rect
            x="5"
            y="-40"
            width="190"
            height="180"
            rx="6"
            fill="white"
            stroke="#008080"
            strokeWidth="2"
            filter="url(#glow-analyzer)"
          />

          {/* BED file content - 3 columns: chr | start | end */}
          {[
            { y: -10, o: 0.4, w2: 35, w3: 38 },
            { y: 0, o: 0.3, w2: 30, w3: 45 },
            { y: 10, o: 0.4, w2: 38, w3: 35 },
            { y: 20, o: 0.3, w2: 32, w3: 42 },
            { y: 30, o: 0.4, w2: 35, w3: 38 },
            { y: 40, o: 0.3, w2: 28, w3: 45 },
            { y: 50, o: 0.4, w2: 38, w3: 35 },
            { y: 60, o: 0.3, w2: 32, w3: 42 },
            { y: 70, o: 0.4, w2: 35, w3: 38 },
            { y: 80, o: 0.3, w2: 30, w3: 45 },
            { y: 90, o: 0.4, w2: 38, w3: 35 },
            { y: 100, o: 0.3, w2: 32, w3: 42 },
            { y: 110, o: 0.4, w2: 35, w3: 38 },
            { y: 120, o: 0.3, w2: 30, w3: 45 },
          ].map((row, i) => (
            <g key={i}>
              <rect x="25" y={row.y} width="20" height="3" rx="1.5" fill="#008080" opacity={row.o}/>
              <rect x="55" y={row.y} width={row.w2} height="3" rx="1.5" fill="#008080" opacity={row.o}/>
              <rect x="100" y={row.y} width={row.w3} height="3" rx="1.5" fill="#008080" opacity={row.o}/>
            </g>
          ))}
          <text x="182" y="123" fontSize="9" fill="#008080" opacity="0.5" textAnchor="end" fontFamily="monospace">.bed</text>
        </g>

        {/* Results rectangle - cut off from bottom */}
        <g>
          <rect
            x="210"
            y="80"
            width="190"
            height="180"
            rx="6"
            fill="white"
            stroke="#008080"
            strokeWidth="2"
            filter="url(#glow-analyzer)"
          />

          {/* Bar chart graphic */}
          <g transform="translate(225, 95)">
            {/* Chart bars */}
            <rect x="10" y="15" width="10" height="25" rx="1" fill="#008080" opacity="0.6"/>
            <rect x="28" y="10" width="10" height="30" rx="1" fill="#008080" opacity="0.6"/>
            <rect x="46" y="8" width="10" height="32" rx="1" fill="#008080" opacity="0.6"/>
            <rect x="64" y="12" width="10" height="28" rx="1" fill="#008080" opacity="0.6"/>
            <rect x="82" y="6" width="10" height="34" rx="1" fill="#008080" opacity="0.6"/>
            <rect x="100" y="14" width="10" height="26" rx="1" fill="#008080" opacity="0.6"/>
            <rect x="118" y="11" width="10" height="29" rx="1" fill="#008080" opacity="0.6"/>
            <rect x="136" y="9" width="10" height="31" rx="1" fill="#008080" opacity="0.6"/>
          </g>

          {/* Table graphic */}
          <g transform="translate(225, 145)">
            {/* Table header */}
            <rect x="0" y="8" width="160" height="12" rx="1" fill="#008080" opacity="0.2"/>
            {/* Table rows */}
            <rect x="0" y="22" width="160" height="8" rx="1" fill="#6c757d" opacity="0.1"/>
            <rect x="0" y="32" width="160" height="8" rx="1" fill="#6c757d" opacity="0.05"/>
            <rect x="0" y="42" width="160" height="8" rx="1" fill="#6c757d" opacity="0.1"/>
            <rect x="0" y="52" width="160" height="8" rx="1" fill="#6c757d" opacity="0.05"/>
            <rect x="0" y="62" width="160" height="8" rx="1" fill="#6c757d" opacity="0.1"/>
            {/* Vertical lines for columns */}
            <line x1="55" y1="8" x2="55" y2="70" stroke="#6c757d" strokeWidth="0.5" opacity="0.3"/>
            <line x1="108" y1="8" x2="108" y2="70" stroke="#6c757d" strokeWidth="0.5" opacity="0.3"/>
          </g>
        </g>
      </svg>
    </div>
  );
};
