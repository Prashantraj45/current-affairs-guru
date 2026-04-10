export default function CalendarDay({ entry, onSelect, selected }) {
  const count = entry.topicCount || entry.topics?.length || 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className={`tap-target flex min-h-[70px] flex-col items-start rounded-xl border p-3 text-left transition ${
        selected
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-outline-variant bg-surface-mid text-on-surface hover:border-primary/30'
      }`}
    >
      <span className="text-xs">{entry.date}</span>
      <span className="mt-1 text-sm font-semibold">{count} topics</span>
    </button>
  );
}
