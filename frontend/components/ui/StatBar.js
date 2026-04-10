import { motion } from 'framer-motion';

export default function StatBar({ label, value = 0 }) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm text-on-surface">{label}</span>
        <span className="text-xs text-on-surface-variant">{width}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-high">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
