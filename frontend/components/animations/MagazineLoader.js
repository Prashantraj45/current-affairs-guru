import { useEffect, useState } from 'react';
import styles from './MagazineLoader.module.css';

const LOADER_KEY = 'magazineLoaderShown';

// phase: 'hidden' | 'visible' | 'fading'
export default function MagazineLoader() {
  const [phase, setPhase] = useState('hidden');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const alreadyShown = window.sessionStorage.getItem(LOADER_KEY);
    if (alreadyShown) return;

    setPhase('visible');

    const fadeTimer = window.setTimeout(() => setPhase('fading'), 3500);
    const hideTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(LOADER_KEY, 'true');
      setPhase('hidden');
    }, 4000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#080f1f]"
      style={{
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 500ms ease',
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
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
    </div>
  );
}
