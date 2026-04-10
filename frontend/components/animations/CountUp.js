import { animate, useMotionValue, useTransform, motion } from 'framer-motion';
import { useEffect } from 'react';

export default function CountUp({ value = 0, duration = 1.2, className = '' }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, Number(value) || 0, { duration, ease: 'easeOut' });
    return () => controls.stop();
  }, [count, duration, value]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
