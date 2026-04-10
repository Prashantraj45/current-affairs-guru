import { useState } from 'react';

export default function MCQBlock({ mcq }) {
  const [selected, setSelected] = useState(null);
  if (!mcq?.question) return null;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-mid p-4">
      <p className="mb-4 text-sm font-semibold text-on-surface">{mcq.question}</p>
      <div className="space-y-2">
        {(mcq.options || []).map((option) => {
          const active = selected === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(option)}
              className={`tap-target w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                active
                  ? 'scale-[0.99] border-primary bg-primary/10 text-on-surface'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary/30'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {selected ? (
        <p className="mt-3 text-xs text-on-surface-variant">
          {selected === mcq.answer ? 'Correct.' : `Answer: ${mcq.answer}`}
        </p>
      ) : null}
    </div>
  );
}
