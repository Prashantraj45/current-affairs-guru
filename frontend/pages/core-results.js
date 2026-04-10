import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import TopicRow from '../components/ui/TopicRow';

const MEMES = [
  {
    top: 'When UPSC asks from left field',
    bottom: 'and you revised that exact note yesterday.',
  },
  {
    top: 'You opened 40 tabs for one topic',
    bottom: 'but the answer came from your first source.',
  },
  {
    top: 'Brain says take a break',
    bottom: 'heart says one more PYQ.',
  },
  {
    top: 'Me: only 20 minutes today',
    bottom: 'Current affairs: surprise 3-hour saga.',
  },
];

export default function CoreResultsPage() {
  const router = useRouter();
  const { query, label } = router.query;
  const [allTopics, setAllTopics] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await api.get('/api/history');
      if (!active) return;
      const flattened = (response.data.entries || []).flatMap((entry) =>
        (entry.topics || []).map((topic) => ({ ...topic, date: entry.date }))
      );
      setAllTopics(flattened);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = String(query || '').toLowerCase();
  const matches = useMemo(() => {
    if (!normalizedQuery) return [];
    return allTopics.filter((topic) => {
      const haystack = [
        topic.title,
        topic.summary,
        topic.category,
        ...(topic.tags || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [allTopics, normalizedQuery]);

  const meme = useMemo(() => {
    const idx = Math.floor(Math.random() * MEMES.length);
    return MEMES[idx];
  }, []);

  return (
    <>
      <PageHeader
        label="Core Results"
        title={String(label || 'Signal Match')}
        meta={`${matches.length} topic(s) matched`}
      />

      {matches.length ? (
        <div className="space-y-2">
          {matches.map((topic) => (
            <TopicRow key={`${topic.date}-${topic.id}`} topic={topic} date={topic.date} />
          ))}
        </div>
      ) : (
        <motion.div
          className="glass-panel rounded-[28px] border p-8 text-center"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="mx-auto mb-5 h-20 w-20 rounded-full border-2 border-dashed border-primary/45"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">No Match Found</p>
          <h2 className="mt-2 font-headline text-3xl text-on-surface">{meme.top}</h2>
          <p className="mt-2 text-sm text-on-surface-variant">{meme.bottom}</p>
        </motion.div>
      )}
    </>
  );
}
