import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const LOADER_KEY = 'magazineLoaderShown';

export default function MagazineLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const alreadyShown = window.sessionStorage.getItem(LOADER_KEY);
    if (alreadyShown) return;

    setVisible(true);
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(LOADER_KEY, 'true');
      setVisible(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#080f1f]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.5 } }}
        >
          <div className="relative h-[220px] w-[min(80vw,300px)] [perspective:1200px]">
            <motion.div
              className="absolute inset-0 rounded-xl bg-slate-900"
              initial={{ scale: 0 }}
              animate={{ scale: 1, transition: { duration: 0.3 } }}
            />

            <motion.div
              className="absolute left-0 top-0 h-full w-1/2 origin-left rounded-l-xl border border-slate-500/30 bg-slate-800"
              initial={{ rotateY: 0 }}
              animate={{ rotateY: -145, transition: { delay: 0.3, duration: 0.4 } }}
            />

            <motion.div
              className="absolute right-0 top-0 h-full w-1/2 origin-right rounded-r-xl border border-slate-500/30 bg-slate-800"
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 145, transition: { delay: 0.3, duration: 0.4 } }}
            />

            <div className="absolute inset-[16%] overflow-hidden rounded-md border border-slate-500/30 bg-slate-100/95">
              <motion.div
                className="h-[400%] w-full bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_32%,#cbd5e1_55%,#f8fafc_100%)]"
                animate={{ y: ['0%', '-75%'] }}
                transition={{ duration: 0.8, delay: 0.75, repeat: 3, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
