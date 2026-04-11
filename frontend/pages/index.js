import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { getCache, setCache } from '../lib/cache';
import PageHeader from '../components/layout/PageHeader';
import SectionTitle from '../components/layout/SectionTitle';
import TopicCard from '../components/ui/TopicCard';
import TopicRow from '../components/ui/TopicRow';
import ScrollReveal from '../components/animations/ScrollReveal';
import StaggerContainer from '../components/animations/StaggerContainer';

export default function DashboardPage() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const cached = getCache(`today_${today}`);
        if (cached) {
          if (active) { setPayload(cached); setLoading(false); }
          return;
        }
        const response = await api.get('/api/today');
        setCache(`today_${today}`, response.data);
        if (active) setPayload(response.data);
      } catch (e) {
        if (active) setError(e?.response?.data?.error || e?.message || 'Could not load dashboard.');
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
  const tagCloud = useMemo(() => [...new Set(topics.flatMap((topic) => topic.tags || []))], [topics]);

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

      {(topics[3] || topics[4] || topics[5]) ? (
        <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {topics[3] ? <TopicCard topic={topics[3]} date={payload?.date} variant="compact" /> : null}
          {topics[4] ? <TopicCard topic={topics[4]} date={payload?.date} variant="compact" /> : null}
          {topics[5] ? <TopicCard topic={topics[5]} date={payload?.date} variant="compact" /> : null}
        </section>
      ) : null}

      {topics.slice(6).length ? (
        <section className="mt-10">
          <SectionTitle title="More Topics" />
          <StaggerContainer className="space-y-2">
            {topics.slice(6).map((topic) => (
              <TopicRow key={topic.id} topic={topic} date={payload?.date} />
            ))}
          </StaggerContainer>
        </section>
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
