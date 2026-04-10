import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import styles from './MagazineLoader.module.css';

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
    }, 3500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#080f1f]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
        >
          <div className={styles.book}>
            <span className={`${styles.page} ${styles.pageTurn}`} />
            <span className={`${styles.page} ${styles.pageTurn}`} />
            <span className={`${styles.page} ${styles.pageTurn}`} />
            <span className={`${styles.page} ${styles.pageTurn}`} />
            <span className={`${styles.page} ${styles.pageTurn}`} />
            <span className={`${styles.page} ${styles.pageTurn}`} />
            <span className={styles.cover} />
            <span className={styles.page} />
            <span className={`${styles.cover} ${styles.coverTurn}`} />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
