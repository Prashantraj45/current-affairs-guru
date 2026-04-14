import { motion } from 'framer-motion';
import { BookOpen, Target, TrendingUp, Tag } from 'lucide-react';

export default function CaseStudyCard({ caseStudy }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative flex h-full flex-col overflow-hidden rounded-panel border border-teal-500/25 bg-[color-mix(in_srgb,var(--surface-mid)_76%,transparent)] backdrop-blur-[18px]"
    >
      {/* Left accent bar */}
      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-teal-400 to-teal-600" />

      <div className="flex flex-1 flex-col gap-4 p-5 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/35 bg-teal-500/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-400">
              <BookOpen className="h-3 w-3" />
              Case Study
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-headline text-lg leading-snug text-on-surface">
          {caseStudy.title}
        </h3>

        {/* Problem */}
        {caseStudy.problem ? (
          <div className="flex gap-2.5">
            <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400">Problem</p>
              <p className="text-sm leading-relaxed text-on-surface-variant line-clamp-2">{caseStudy.problem}</p>
            </div>
          </div>
        ) : null}

        {/* Outcome */}
        {caseStudy.outcome ? (
          <div className="flex gap-2.5">
            <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Outcome</p>
              <p className="text-sm leading-relaxed text-on-surface-variant line-clamp-2">{caseStudy.outcome}</p>
            </div>
          </div>
        ) : null}

        {/* Learning Points */}
        {caseStudy.learningPoints?.length ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Key Learnings
            </p>
            <ul className="space-y-1.5">
              {caseStudy.learningPoints.slice(0, 3).map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-on-surface-variant">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Tags */}
        {caseStudy.tags?.length ? (
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
            <Tag className="h-3 w-3 shrink-0 text-on-surface-variant/50" />
            {caseStudy.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-outline-variant px-2 py-0.5 text-[11px] text-on-surface-variant transition hover:border-teal-500/40 hover:text-teal-400"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}
