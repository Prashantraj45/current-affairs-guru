export default function BriefingCard({ title, items, accent = 'text-primary' }) {
  if (!items?.length) return null;
  return (
    <section className="glass-panel rounded-panel border p-5">
      <h3 className={`mb-3 text-xs font-semibold uppercase tracking-[0.17em] ${accent}`}>{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2 text-sm text-on-surface-variant">
            <span className={`${accent}`}>+</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
