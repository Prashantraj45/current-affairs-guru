export default function SectionTitle({ title, note }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.17em] text-on-surface-variant">
        {title}
      </h2>
      <div className="h-px flex-1 bg-outline-variant" />
      {note ? <span className="text-xs text-on-surface-variant">{note}</span> : null}
    </div>
  );
}
