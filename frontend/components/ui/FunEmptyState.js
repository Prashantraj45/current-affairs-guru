import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const MEMES = [
  {
    top: 'Data took a chai break',
    bottom: 'No worries. Signal will be back before your next revision sprint.',
  },
  {
    top: '404: Motivation not found',
    bottom: 'Kidding. Your filters are just too specific for this window.',
  },
  {
    top: 'The archive is meditating',
    bottom: 'Try another month or widen the date range to summon the facts.',
  },
  {
    top: 'Current affairs went incognito',
    bottom: 'They hide well. Adjust the range and we will track them down.',
  },
];

function pickMeme(storageKey) {
  if (typeof window === 'undefined') return 0;
  const previous = Number(window.sessionStorage.getItem(storageKey) || '-1');
  const choices = MEMES.map((_, idx) => idx).filter((idx) => idx !== previous);
  const randomIdx = choices[Math.floor(Math.random() * choices.length)] ?? 0;
  window.sessionStorage.setItem(storageKey, String(randomIdx));
  return randomIdx;
}

export default function FunEmptyState({ storageKey = 'fun-empty-default', label = 'No Data' }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(pickMeme(storageKey));
  }, [storageKey]);

  const meme = useMemo(() => MEMES[index] || MEMES[0], [index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-[26px] border p-8 text-center"
    >
      <motion.div
        className="mx-auto mb-5 h-20 w-20 rounded-full border-2 border-dashed border-primary/45"
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
      <h2 className="mt-2 font-headline text-3xl text-on-surface">{meme.top}</h2>
      <p className="mt-2 text-sm text-on-surface-variant">{meme.bottom}</p>
    </motion.div>
  );
}
