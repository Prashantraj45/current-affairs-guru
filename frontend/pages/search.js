import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Search } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import StaggerContainer from '../components/animations/StaggerContainer';
import TopicRow from '../components/ui/TopicRow';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await api.get('/api/history');
      if (!active) return;
      const allTopics = (response.data.entries || []).flatMap((entry) =>
        (entry.topics || []).map((topic) => ({ ...topic, date: entry.date }))
      );
      setTopics(allTopics);
      const initial = typeof router.query.q === 'string' ? router.query.q : '';
      if (initial) setQuery(initial);
    }
    load();
    return () => {
      active = false;
    };
  }, [router.query.q]);

  const results = useMemo(() => {
    if (!query.trim()) return topics.slice(0, 15);
    const q = query.toLowerCase();
    return topics.filter((topic) => {
      const haystack = [topic.title, topic.summary, ...(topic.tags || [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [query, topics]);

  return (
    <>
      <PageHeader label="Search" title="Find Intelligence Fast" meta={`${results.length} results`} />
      <div className="glass-panel rounded-panel border p-4">
        <label htmlFor="search-input" className="mb-2 block text-xs uppercase tracking-[0.17em] text-on-surface-variant">
          Search Topics
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-mid px-3">
          <Search className="h-4 w-4 text-on-surface-variant" />
          <input
            id="search-input"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full bg-transparent text-base text-on-surface outline-none placeholder:text-on-surface-variant"
            placeholder="Try Budget, LAC, climate finance..."
          />
        </div>
      </div>

      <div className="mt-5">
        {results.length ? (
          <StaggerContainer className="space-y-2">
            {results.map((topic) => (
              <TopicRow key={`${topic.date}-${topic.id}`} topic={topic} date={topic.date} />
            ))}
          </StaggerContainer>
        ) : (
          <div className="glass-panel rounded-panel border p-8 text-center text-sm text-on-surface-variant">
            No matching topics. Try category names or tags from the syllabus.
          </div>
        )}
      </div>
    </>
  );
}
