import { CATEGORY_COLORS } from '../../lib/constants';
import { normalizeCategory } from '../../lib/format';

export default function CategoryBadge({ category, className = '' }) {
  const normalized = normalizeCategory(category);
  const styles = CATEGORY_COLORS[normalized] || CATEGORY_COLORS.Reports;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles.soft} ${styles.text} ${styles.border} ${className}`}
    >
      {normalized}
    </span>
  );
}
