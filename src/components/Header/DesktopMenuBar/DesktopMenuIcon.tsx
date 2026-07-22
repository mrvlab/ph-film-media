'use client';

import { motion, Transition } from 'framer-motion';

type Props = {
  isOpen?: boolean;
  color?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  transition?: Transition;
};

// Two full-width strokes morphing between a hamburger and a shallow, wide X.
const ANGLE = 14;
const OFFSET = 7.5;

const defaultTransition: Transition = { duration: 0.3, ease: 'easeInOut' };

export const DesktopMenuIcon = ({
  isOpen = false,
  color = 'var(--color-white)',
  width = '6.4rem',
  height = '2.8rem',
  className,
  transition = defaultTransition,
}: Props) => {
  const variant = isOpen ? 'opened' : 'closed';

  const top = {
    closed: { rotate: 0, y: -OFFSET },
    opened: { rotate: ANGLE, y: 0 },
  };
  const bottom = {
    closed: { rotate: 0, y: OFFSET },
    opened: { rotate: -ANGLE, y: 0 },
  };

  const lineProps = {
    x1: 0,
    x2: 64,
    y1: 14,
    y2: 14,
    stroke: color,
    strokeWidth: 1,
    vectorEffect: 'non-scaling-stroke' as const,
    initial: 'closed',
    animate: variant,
    transition,
  };

  return (
    <motion.svg
      width={width}
      height={height}
      className={className}
      viewBox='0 0 64 28'
      fill='none'
      overflow='visible'
    >
      <motion.line variants={top} {...lineProps} />
      <motion.line variants={bottom} {...lineProps} />
    </motion.svg>
  );
};
