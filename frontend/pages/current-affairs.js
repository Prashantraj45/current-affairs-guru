import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import NewsTimelineItem from '../components/ui/NewsTimelineItem';
import StaggerContainer from '../components/animations/StaggerContainer';
import ScrollReveal from '../components/animations/ScrollReveal';
import { TABS } from '../lib/constants';

function selectEntries(entries, tab) {
  if (tab === 'daily') return entries.slice(0, 2);
  if (tab === 'weekly') return entries.slice(0, 7);
  return entries.slice(0, 30);
}

export default function CurrentAffairsPage() {
  const [tab, setTab] = useState('daily');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await api.get('/api/history');
      if (active) setHistory(response.data.entries || []);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const feed = useMemo(() => {
    const scoped = selectEntries(history, tab);
    return scoped.flatMap((entry) => (entry.topics || []).map((topic) => ({ topic, date: entry.date })));
  }, [history, tab]);

  const trending = useMemo(() => {
    const all = feed.slice(0, 20);
    const count = new Map();
    all.forEach((item) => {
      const key = item.topic.category || 'General';
      count.set(key, (count.get(key) || 0) + 1);
    });
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [feed]);

  return (
    <>
      <PageHeader
        label="Current Affairs"
        title="Daily, Weekly, Monthly"
        meta="Timeline feed with trends and digest context"
      />

      <div className="mb-5 flex gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`tap-target rounded-full border px-4 py-2 text-sm capitalize transition ${
              tab === item
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <StaggerContainer className="space-y-3">
          {feed.map((item, index) => (
            <NewsTimelineItem
              key={`${item.date}-${item.topic.id}`}
              topic={item.topic}
              date={item.date}
              showLine={index !== feed.length - 1}
            />
          ))}
        </StaggerContainer>

        <aside className="space-y-4">
          <ScrollReveal>
            <div className="glass-panel rounded-panel border p-4">
              <h3 className="mb-3 text-xs uppercase tracking-[0.17em] text-on-surface-variant">Trending Domains</h3>
              <div className="space-y-2">
                {trending.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="text-on-surface">{name}</span>
                    <span className="text-on-surface-variant">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="glass-panel rounded-panel border p-4">
              <h3 className="mb-2 text-xs uppercase tracking-[0.17em] text-on-surface-variant">Monthly Digest</h3>
              <p className="text-sm text-on-surface-variant">
                High-yield coverage currently leans toward economy, governance, and science transitions. Keep one
                revision cycle focused on repeated categories.
              </p>
            </div>
          </ScrollReveal>
        </aside>
      </section>
    </>
  );
}
