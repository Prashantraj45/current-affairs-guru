import { Children } from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function StaggerContainer({ children, className = '' }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {Children.map(children, (child, index) => (
        <motion.div key={index} variants={childVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
