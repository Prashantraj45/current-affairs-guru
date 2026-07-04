import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import ImportanceBadge from './ImportanceBadge';

export default function TopicRow({ topic, date }) {
  const href = date ? `/topic/${topic.id}?date=${date}` : `/topic/${topic.id}`;
  return (
    <Link href={href} className="group block rounded-xl border border-transparent transition hover:border-outline-variant">
      <article className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-surface-mid">
        <ImportanceBadge importance={topic.importance} compact />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-on-surface transition group-hover:text-primary">{topic.title}</h3>
          <p className="line-clamp-1 text-xs text-on-surface-variant">{topic.summary || topic.why_in_news}</p>
          {topic.sources?.length > 0 && (
            <div className="mt-0.5 flex items-center gap-1">
              <Newspaper className="h-2.5 w-2.5 shrink-0 text-amber-400/60" />
              <span className="truncate text-[10px] text-amber-400/80">{topic.sources[0]}</span>
            </div>
          )}
        </div>
        <CategoryBadge category={topic.category} className="hidden sm:inline-flex" />
        <ArrowRight className="h-4 w-4 text-on-surface-variant transition group-hover:translate-x-1 group-hover:text-primary" />
      </article>
    </Link>
  );
}
