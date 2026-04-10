import { useEffect, useState } from 'react';
import api from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import ScrollReveal from '../components/animations/ScrollReveal';
import StaggerContainer from '../components/animations/StaggerContainer';
import TopicRow from '../components/ui/TopicRow';
import CalendarDay from '../components/ui/CalendarDay';

export default function HistoryPage() {
  const [data, setData] = useState({ total: 0, entries: [] });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await api.get('/api/history');
        if (!active) return;
        setData(response.data);
        setSelected(response.data.entries?.[0] || null);
      } catch (e) {
        if (!active) return;
        setData({ total: 0, entries: [] });
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-sm text-on-surface-variant">Loading archive...</div>;
  }

  return (
    <>
      <PageHeader label="Archive" title="History" meta={`${data.total} days of intelligence`} />
      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="glass-panel rounded-panel border p-4">
          <h2 className="mb-3 text-xs uppercase tracking-[0.17em] text-on-surface-variant">Calendar View</h2>
          <div className="grid grid-cols-2 gap-2">
            {data.entries.map((entry) => (
              <CalendarDay
                key={entry.date}
                entry={entry}
                selected={selected?.date === entry.date}
                onSelect={setSelected}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <StaggerContainer className="space-y-4">
            {(selected ? [selected] : data.entries).map((entry) => (
              <ScrollReveal key={entry.date}>
                <article className="glass-panel rounded-panel border p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-headline text-2xl text-on-surface">{entry.date}</h3>
                    <span className="rounded-full border border-outline-variant px-3 py-1 text-xs text-on-surface-variant">
                      {entry.topicCount} topics
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(entry.topics || []).map((topic) => (
                      <TopicRow key={topic.id} topic={topic} date={entry.date} />
                    ))}
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </>
  );
}
