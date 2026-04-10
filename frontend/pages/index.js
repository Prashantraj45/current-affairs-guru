import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import SectionTitle from '../components/layout/SectionTitle';
import TopicCard from '../components/ui/TopicCard';
import TopicRow from '../components/ui/TopicRow';
import MagazineLoader from '../components/animations/MagazineLoader';
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
        const response = await api.get('/api/today');
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
      <MagazineLoader />
      <PageHeader
        label="Daily Intelligence"
        title="Today's Briefing"
        meta={`${payload?.date || ''}  |  ${topics.length} topics`}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {topics[0] ? <TopicCard topic={topics[0]} date={payload?.date} variant="hero" /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {topics[1] ? <TopicCard topic={topics[1]} date={payload?.date} variant="side" /> : null}
          {topics[2] ? <TopicCard topic={topics[2]} date={payload?.date} variant="side" /> : null}
        </div>
      </section>

      {topics.slice(3).length ? (
        <section className="mt-10">
          <SectionTitle title="More Topics" />
          <StaggerContainer className="space-y-2">
            {topics.slice(3).map((topic) => (
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
