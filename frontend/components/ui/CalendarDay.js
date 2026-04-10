export default function CalendarDay({
  entry,
  onSelect,
  selected,
  day,
  empty = false,
  compact = false,
}) {
  const count = entry?.topicCount || entry?.topics?.length || 0;

  if (empty) {
    return <div className="h-11 rounded-xl border border-transparent md:h-14" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className={`tap-target group relative flex min-h-[44px] flex-col items-center justify-center rounded-xl border text-center transition md:min-h-[56px] ${
        selected
          ? 'border-primary/55 bg-primary/14 text-primary shadow-[0_8px_24px_rgba(67,85,185,0.18)]'
          : 'border-outline-variant/45 bg-surface-mid/70 text-on-surface hover:border-primary/35 hover:bg-surface-high/80'
      }`}
      aria-label={entry?.date || `Day ${day}`}
    >
      <span className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>{day || entry?.date?.slice(-2)}</span>
      {!compact ? <span className="mt-0.5 text-[10px] text-on-surface-variant">{count} topics</span> : null}
      {count > 0 ? (
        <span
          className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
            selected ? 'bg-primary' : 'bg-tertiary'
          }`}
        />
      ) : null}
    </button>
  );
}
