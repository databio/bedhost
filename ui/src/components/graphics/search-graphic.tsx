import { useState } from 'react';

export const SearchGraphic = () => {
  const [searchText, setSearchText] = useState('H3K27ac in liver cells');

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

        {/* Search bar mockup */}
        <g>
          <rect
            x="50"
            y="30"
            width="300"
            height="40"
            rx="8"
            fill="white"
            stroke="#008080"
            strokeWidth="2"
            filter="url(#glow)"
          />

          {/* Lucide search icon */}
          <g transform="translate(58, 38)">
            <circle
              cx="11"
              cy="11"
              r="8"
              fill="none"
              stroke="#6c757d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="21"
              y1="21"
              x2="16.65"
              y2="16.65"
              stroke="#6c757d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Text element for sizing */}
          <foreignObject x="90" y="37" width="250" height="26">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '14px',
                color: '#6c757d',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                width: '100%',
                padding: '0',
              }}
            />
          </foreignObject>
        </g>

        {/* Connecting lines */}
        <g>
          {/* Line to file 1 */}
          <path
            d="M 130 70 Q 130 110 100 150"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-10"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>

          {/* Line to file 2 */}
          <path
            d="M 170 70 Q 170 110 150 150"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-10"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>

          {/* Line to file 3 */}
          <path
            d="M 210 70 Q 210 110 200 150"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-10"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>

          {/* Line to file 4 */}
          <path
            d="M 250 70 Q 250 110 250 150"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-10"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>

          {/* Line to file 5 */}
          <path
            d="M 270 70 Q 270 110 300 150"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-10"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Grid of file icons */}
        <g>
          {/* File 1 */}
          <g transform="translate(85, 150)">
            <rect
              x="0"
              y="0"
              width="30"
              height="40"
              rx="4"
              fill="white"
              stroke="#008080"
              strokeWidth="1.5"
            />
            <rect x="5" y="8" width="20" height="2" rx="1" fill="#008080" opacity="0.4"/>
            <rect x="5" y="14" width="15" height="2" rx="1" fill="#008080" opacity="0.3"/>
            <rect x="5" y="20" width="20" height="2" rx="1" fill="#008080" opacity="0.4"/>
            <rect x="5" y="26" width="12" height="2" rx="1" fill="#008080" opacity="0.3"/>
          </g>

          {/* File 2 */}
          <g transform="translate(135, 150)">
            <rect
              x="0"
              y="0"
              width="30"
              height="40"
              rx="4"
              fill="white"
              stroke="#008080"
              strokeWidth="1.5"
            />
            <rect x="5" y="8" width="20" height="2" rx="1" fill="#008080" opacity="0.4"/>
            <rect x="5" y="14" width="15" height="2" rx="1" fill="#008080" opacity="0.3"/>
            <rect x="5" y="20" width="20" height="2" rx="1" fill="#008080" opacity="0.4"/>
            <rect x="5" y="26" width="12" height="2" rx="1" fill="#008080" opacity="0.3"/>
          </g>

          {/* File 3 */}
          <g transform="translate(185, 150)">
            <rect
              x="0"
              y="0"
              width="30"
              height="40"
              rx="4"
              fill="white"
              stroke="#008080"
              strokeWidth="1.5"
            />
            <rect x="5" y="8" width="20" height="2" rx="1" fill="#008080" opacity="0.4"/>
            <rect x="5" y="14" width="15" height="2" rx="1" fill="#008080" opacity="0.3"/>
            <rect x="5" y="20" width="20" height="2" rx="1" fill="#008080" opacity="0.4"/>
            <rect x="5" y="26" width="12" height="2" rx="1" fill="#008080" opacity="0.3"/>
          </g>

          {/* File 4 */}
          <g transform="translate(235, 150)">
            <rect
              x="0"
              y="0"
              width="30"
              height="40"
              rx="4"
              fill="white"
              stroke="#008080"
              strokeWidth="1.5"
            />
            <rect x="5" y="8" width="20" height="2" rx="1" fill="#008080" opacity="0.4"/>
            <rect x="5" y="14" width="15" height="2" rx="1" fill="#008080" opacity="0.3"/>
            <rect x="5" y="20" width="20" height="2" rx="1" fill="#008080" opacity="0.4"/>
            <rect x="5" y="26" width="12" height="2" rx="1" fill="#008080" opacity="0.3"/>
          </g>

          {/* File 5 */}
          <g transform="translate(285, 150)">
            <rect
              x="0"
              y="0"
              width="30"
              height="40"
              rx="4"
              fill="white"
              stroke="#008080"
              strokeWidth="1.5"
            />
            <rect x="5" y="8" width="20" height="2" rx="1" fill="#008080" opacity="0.4"/>
            <rect x="5" y="14" width="15" height="2" rx="1" fill="#008080" opacity="0.3"/>
            <rect x="5" y="20" width="20" height="2" rx="1" fill="#008080" opacity="0.4"/>
            <rect x="5" y="26" width="12" height="2" rx="1" fill="#008080" opacity="0.3"/>
          </g>
        </g>
      </svg>
    </div>
  );
};
