import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import CategoryBadge from '../../components/ui/CategoryBadge';
import ImportanceBadge from '../../components/ui/ImportanceBadge';
import PageHeader from '../../components/layout/PageHeader';
import ScrollReveal from '../../components/animations/ScrollReveal';
import MCQBlock from '../../components/ui/MCQBlock';

const SECTIONS = [
  { id: 'why-news', label: 'Why in News' },
  { id: 'facts', label: 'Key Facts' },
  { id: 'explanation', label: 'Explanation' },
  { id: 'prelims', label: 'Prelims' },
  { id: 'mains', label: 'Mains' },
];

export default function TopicDetailPage() {
  const router = useRouter();
  const { id, date } = router.query;
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    async function load() {
      try {
        const path = date ? `/api/topic/${id}?date=${date}` : `/api/topic/${id}`;
        const response = await api.get(path);
        if (active) setTopic(response.data);
      } catch (e) {
        if (active) setError(e?.response?.data?.error || e?.message || 'Failed to load topic.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [date, id]);

  const fallbackFacts = useMemo(
    () => topic?.facts || topic?.prelims?.key_facts || [],
    [topic?.facts, topic?.prelims?.key_facts]
  );

  if (loading) return <div className="py-16 text-center text-sm text-on-surface-variant">Loading topic...</div>;
  if (error) return <div className="glass-panel rounded-panel border border-red-500/35 p-5 text-sm text-red-400">{error}</div>;
  if (!topic) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_250px]">
      <article>
        <Link href={date ? `/history?date=${date}` : '/'} className="mb-4 inline-block text-sm text-primary">
          Back
        </Link>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <CategoryBadge category={topic.category} />
          <ImportanceBadge importance={topic.importance} />
          <span className="rounded-full border border-outline-variant px-3 py-1 text-xs text-on-surface-variant">
            Score {topic.score || 0}
          </span>
        </div>

        <PageHeader label="Topic Detail" title={topic.title} meta={topic.date || date || ''} />

        <div className="mb-6 rounded-panel border border-primary/35 bg-primary/10 p-4">
          <p className="text-sm leading-relaxed text-on-surface">{topic.summary}</p>
        </div>

        <ScrollReveal>
          <section id="why-news" className="mb-5 rounded-panel border border-outline-variant bg-surface-mid p-5">
            <h2 className="mb-3 font-headline text-3xl text-on-surface">Why in News</h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">{topic.why_in_news}</p>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section id="facts" className="mb-5 rounded-panel border border-outline-variant bg-surface-mid p-5">
            <h2 className="mb-3 font-headline text-3xl text-on-surface">Key Facts</h2>
            <ul className="space-y-2">
              {fallbackFacts.map((fact, index) => (
                <li key={index} className="text-sm text-on-surface-variant">
                  - {fact}
                </li>
              ))}
            </ul>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section id="explanation" className="mb-5 rounded-panel border border-outline-variant bg-surface-mid p-5">
            <h2 className="mb-3 font-headline text-3xl text-on-surface">Explanation</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">{topic.explanation}</p>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section id="prelims" className="mb-5 rounded-panel border border-outline-variant bg-surface-mid p-5">
            <h2 className="mb-3 font-headline text-3xl text-on-surface">For Prelims</h2>
            <MCQBlock mcq={topic?.prelims?.mcq} />
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section id="mains" className="mb-5 rounded-panel border border-outline-variant bg-surface-mid p-5">
            <h2 className="mb-3 font-headline text-3xl text-on-surface">For Mains</h2>
            <span className="mb-3 inline-flex rounded-full border border-primary/35 bg-primary/15 px-3 py-1 text-xs text-primary">
              {topic?.mains?.gs_paper || 'GS'}
            </span>
            <p className="mb-4 text-sm font-semibold text-on-surface">{topic?.mains?.question}</p>
            <div className="space-y-3 border-l-2 border-primary/35 pl-4">
              <p className="text-sm text-on-surface-variant">
                <strong className="text-on-surface">Intro: </strong>
                {topic?.mains?.answer_framework?.intro}
              </p>
              {(topic?.mains?.answer_framework?.body || []).map((item, index) => (
                <p key={index} className="text-sm text-on-surface-variant">
                  - {item}
                </p>
              ))}
              <p className="text-sm text-on-surface-variant">
                <strong className="text-on-surface">Conclusion: </strong>
                {topic?.mains?.answer_framework?.conclusion}
              </p>
            </div>
          </section>
        </ScrollReveal>

        <div className="rounded-panel border border-tertiary/35 bg-tertiary/10 p-4">
          <p className="mb-1 text-xs uppercase tracking-[0.16em] text-tertiary">Revision Note</p>
          <p className="text-sm text-on-surface-variant">{topic.revision_note || 'No revision note available yet.'}</p>
        </div>
      </article>

      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-panel border border-outline-variant bg-surface-mid p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.17em] text-on-surface-variant">Quick Navigation</p>
          <div className="space-y-2">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-lg px-2 py-1.5 text-sm text-on-surface-variant transition hover:bg-surface-high hover:text-primary"
              >
                {section.label}
              </a>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
