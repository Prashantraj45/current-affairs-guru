import { IMPORTANCE_COLORS } from '../../lib/constants';

export default function ImportanceBadge({ importance = 'LOW', compact = false }) {
  const level = String(importance).toUpperCase();
  const styles = IMPORTANCE_COLORS[level] || IMPORTANCE_COLORS.LOW;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
        <span className={`text-xs font-medium ${styles.text}`}>{level}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles.soft} ${styles.text} ${styles.border}`}
    >
      {level}
    </span>
  );
}
