import { motion } from 'framer-motion';
import { PRIMARY_COLOR } from '../const';

const STROKE_WIDTH = 2;
const STROKE_SPEAD = 0;

export const InPaths = () => {
  return (
    <motion.svg
      className="h-100 w-full"
      viewBox="0 0 300 560"
      preserveAspectRatio="xMinYMid meet"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 1,
        delay: 0.5,
      }}
    >
      <motion.path
        fill="none"
        vectorEffect="non-scaling-stroke"
        d="m 0,160 h 150 v 95 h 250%"
        strokeWidth={STROKE_WIDTH}
        id="path1"
        stroke={PRIMARY_COLOR}
        animate={{
          strokeDashoffset: [-20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
          direction: 'revert',
        }}
        strokeDasharray="6,6"
        transition={{
          duration: STROKE_SPEAD,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
        }}
      />
      {/* straight across */}
      <motion.line
        vectorEffect="non-scaling-stroke"
        x1="0%"
        y1="50%"
        x2="100%"
        y2="50%"
        strokeWidth={STROKE_WIDTH}
        animate={{
          strokeDashoffset: [-20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        }}
        strokeDasharray="6,6"
        transition={{
          duration: STROKE_SPEAD,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
        }}
        stroke={PRIMARY_COLOR}
      />
      <motion.path
        fill="none"
        vectorEffect="non-scaling-stroke"
        d="m 0,406 h 150 v -103 h 250%"
        strokeWidth={STROKE_WIDTH}
        id="path1"
        stroke={PRIMARY_COLOR}
        animate={{
          strokeDashoffset: [-20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
          direction: 'revert',
        }}
        strokeDasharray="6,6"
        transition={{
          duration: STROKE_SPEAD,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
        }}
      />
    </motion.svg>
  );
};

export const OutPaths = () => {
  return (
    <motion.svg
      className="h-100 w-full"
      viewBox="0 0 300 510"
      preserveAspectRatio="xMinYMid meet"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 1,
        delay: 0.5,
      }}
    >
      <motion.path
        fill="none"
        vectorEffect="non-scaling-stroke"
        d="m 0,232 h 150 v -87 h 250%"
        strokeWidth={STROKE_WIDTH}
        id="path1"
        stroke={PRIMARY_COLOR}
        animate={{
          strokeDashoffset: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0, -10, -20],
          direction: 'revert',
        }}
        strokeDasharray="6,6"
        transition={{
          duration: STROKE_SPEAD,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
        }}
      />
      {/* straight across */}
      <motion.line
        vectorEffect="non-scaling-stroke"
        x1="0%"
        y1="50%"
        x2="100%"
        y2="50%"
        strokeWidth={STROKE_WIDTH}
        animate={{
          strokeDashoffset: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0, -10, -20],
        }}
        strokeDasharray="6,6"
        transition={{
          duration: STROKE_SPEAD,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
        }}
        stroke={PRIMARY_COLOR}
      />
      <motion.path
        fill="none"
        vectorEffect="non-scaling-stroke"
        d="m 0,275 h 150 v 95 h 550%"
        strokeWidth={STROKE_WIDTH}
        id="path1"
        stroke={PRIMARY_COLOR}
        animate={{
          strokeDashoffset: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0, -10, -20],
          direction: 'revert',
        }}
        strokeDasharray="6,6"
        transition={{
          duration: STROKE_SPEAD,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
        }}
      />
    </motion.svg>
  );
};
