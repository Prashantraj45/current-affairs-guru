import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Newspaper } from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import ImportanceBadge from './ImportanceBadge';
import CountUp from '../animations/CountUp';

export default function TopicCard({ topic, date, variant = 'compact' }) {
  const isHero = variant === 'hero';
  const isSide = variant === 'side';
  const href = date ? `/topic/${topic.id}?date=${date}` : `/topic/${topic.id}`;

  return (
    <Link href={href} className="block">
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={isHero ? undefined : { y: -3 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`glass-panel panel-hover h-full rounded-panel border p-5 ${
          isHero ? 'lg:col-span-2 lg:p-7' : isSide ? 'p-4' : ''
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <CategoryBadge category={topic.category} />
          <ImportanceBadge importance={topic.importance} compact />
        </div>

        <h3
          className={`font-headline text-on-surface ${
            isHero ? 'mb-3 text-3xl leading-tight md:text-4xl' : isSide ? 'text-base' : 'text-xl'
          }`}
        >
          {topic.title}
        </h3>

        <p className={`text-sm leading-relaxed text-on-surface-variant ${isSide ? 'line-clamp-2' : 'line-clamp-3'}`}>
          {topic.summary}
        </p>

        {topic.sources?.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Newspaper className="h-3 w-3 shrink-0 text-amber-400/70" />
            {topic.sources.slice(0, 2).map((src) => (
              <span
                key={src}
                className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400/90"
              >
                {src}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">
            Score <CountUp value={topic.score || 0} className="font-semibold text-on-surface" /> / 100
          </p>
          <span className="inline-flex items-center gap-1 text-sm text-primary">
            Read <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </motion.article>
    </Link>
  );
}
