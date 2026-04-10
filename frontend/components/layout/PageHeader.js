import { motion } from 'framer-motion';

export default function PageHeader({ label, title, meta }) {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {label ? (
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-on-surface-variant">
          {label}
        </p>
      ) : null}
      <h1 className="font-headline text-4xl leading-tight text-on-surface md:text-5xl">{title}</h1>
      {meta ? <p className="mt-2 text-sm text-on-surface-variant">{meta}</p> : null}
    </motion.div>
  );
}
