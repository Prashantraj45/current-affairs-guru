import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { getCache, setCache } from '../lib/cache';
import PageHeader from '../components/layout/PageHeader';
import SectionTitle from '../components/layout/SectionTitle';
import TopicCard from '../components/ui/TopicCard';
import TopicRow from '../components/ui/TopicRow';
import CaseStudyCard from '../components/ui/CaseStudyCard';
import ScrollReveal from '../components/animations/ScrollReveal';
import StaggerContainer from '../components/animations/StaggerContainer';

export default function DashboardPage() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const cacheKey = `today_${today}`;
      const cached = getCache(cacheKey);

      // Show cached data immediately (stale-while-revalidate)
      if (cached) {
        if (active) { setPayload(cached); setLoading(false); }
      }

      // Always fetch fresh — update if API has newer date than cache
      try {
        const response = await api.get('/api/today');
        const fresh = response.data;
        if (active) {
          // Replace if no cache, or if fresh data is for a newer date
          if (!cached || fresh.date > (cached.date || '')) {
            setCache(cacheKey, fresh);
            setPayload(fresh);
          }
        }
      } catch (e) {
        // Only show error if we have nothing to display
        if (active && !cached) {
          setError(e?.response?.data?.error || e?.message || 'Could not load dashboard.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const topics = useMemo(() => payload?.topics || [], [payload?.topics]);
  const caseStudies = useMemo(() => payload?.caseStudies || [], [payload?.caseStudies]);
  const tagCloud = useMemo(() => [...new Set(topics.flatMap((topic) => topic.tags || []))], [topics]);

  // Fill the compact card grid with complete rows of 3, leaving the rest for "More Topics"
  const cardCutoff = useMemo(() => {
    const remaining = topics.length - 3;
    if (remaining <= 0) return 3;
    const rows = Math.min(Math.ceil(remaining / 3), 4); // up to 4 rows (12 cards) in card grid
    return 3 + rows * 3;
  }, [topics.length]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-on-surface-variant">Loading daily intelligence...</div>;
  }

  if (error) {
    return <div className="glass-panel rounded-panel border border-red-500/35 p-5 text-sm text-red-400">{error}</div>;
  }

  return (
    <>
      <PageHeader
        label="GS Intelligence Engine"
        title="Today's Brief"
        meta={`${payload?.date || ''}  |  ${topics.length} topics`}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {topics[0] ? <TopicCard topic={topics[0]} date={payload?.date} variant="hero" /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {topics[1] ? <TopicCard topic={topics[1]} date={payload?.date} variant="side" /> : null}
          {topics[2] ? <TopicCard topic={topics[2]} date={payload?.date} variant="side" /> : null}
        </div>
      </section>

      {topics.slice(3, cardCutoff).length ? (
        <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {topics.slice(3, cardCutoff).map((topic) => (
            <TopicCard key={topic.id} topic={topic} date={payload?.date} variant="compact" />
          ))}
        </section>
      ) : null}

      {topics.slice(cardCutoff).length ? (
        <section className="mt-10">
          <SectionTitle title="More Topics" />
          <StaggerContainer className="space-y-2">
            {topics.slice(cardCutoff).map((topic) => (
              <TopicRow key={topic.id} topic={topic} date={payload?.date} />
            ))}
          </StaggerContainer>
        </section>
      ) : null}

      {caseStudies.length ? (
        <ScrollReveal className="mt-10">
          <SectionTitle title="Case Studies" note={`${caseStudies.length} deep dives`} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {caseStudies.map((cs, i) => (
              <CaseStudyCard key={i} caseStudy={cs} />
            ))}
          </div>
        </ScrollReveal>
      ) : null}

      {tagCloud.length ? (
        <ScrollReveal className="mt-10">
          <SectionTitle title="Coverage Tags" />
          <div className="flex flex-wrap gap-2">
            {tagCloud.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-outline-variant px-3 py-1 text-xs text-on-surface-variant transition hover:border-primary/35 hover:text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        </ScrollReveal>
      ) : null}
    </>
  );
}
