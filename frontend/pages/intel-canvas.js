import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import BriefingCard from '../components/ui/BriefingCard';
import FunEmptyState from '../components/ui/FunEmptyState';

function monthLabel(monthKey) {
  if (!monthKey) return 'Current Month';
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

const fadeScale = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  show: (i) => ({ opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07, ease: 'easeOut' } }),
};

export default function IntelCanvasPage() {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [monthlyInsights, setMonthlyInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadMonthlyIndex() {
      setError('');
      try {
        const response = await api.get('/api/insights/monthly');
        if (!active) return;
        const monthList = response.data.months || [];
        const initialMonth = response.data.currentMonth || response.data.selectedMonth || monthList[0] || '';
        setMonths(monthList.length ? monthList : [initialMonth].filter(Boolean));
        setSelectedMonth(initialMonth);
        setMonthlyInsights(response.data.insights || null);
      } catch (err) {
        if (active) setError(err?.response?.data?.error || 'Could not load monthly insights.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMonthlyIndex();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    let active = true;
    async function loadMonth() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/api/insights/monthly/${selectedMonth}`);
        if (active) setMonthlyInsights(response.data);
      } catch (err) {
        if (active) setError(err?.response?.data?.error || 'Could not load insights.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMonth();
    return () => { active = false; };
  }, [selectedMonth]);

  return (
    <>
      <PageHeader
        label="Signal Deck"
        title={`${monthLabel(selectedMonth)} Analysis`}
        meta="Monthly cross-day governance pattern analysis"
      />

      <section className="glass-panel rounded-[26px] border p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Monthly Insights</p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-on-surface-variant" htmlFor="month-select">Month</label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-mid px-3 py-2 text-sm text-on-surface outline-none"
            >
              {months.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <FunEmptyState storageKey="intel-monthly-error" label="Insights API Error" />
        ) : loading ? (
          <p className="text-sm text-on-surface-variant">Loading monthly insights...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { title: 'Trends', items: monthlyInsights?.trends, accent: 'text-primary' },
              { title: 'Strategy Notes', items: monthlyInsights?.strategyNotes, accent: 'text-tertiary' },
              { title: 'Recurring Themes', items: monthlyInsights?.recurringThemes, accent: 'text-secondary' },
            ].map(({ title, items, accent }, i) => (
              <motion.div key={title} custom={i} variants={fadeScale} initial="hidden" animate="show">
                <BriefingCard title={title} items={items || []} accent={accent} />
              </motion.div>
            ))}
            <motion.div custom={3} variants={fadeScale} initial="hidden" animate="show"
              className="rounded-panel border border-outline-variant bg-surface-high/60 p-4"
            >
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-on-surface-variant">Priority Domains</p>
              <div className="flex flex-wrap gap-2">
                {(monthlyInsights?.highPriorityDomains || []).map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/12 px-2.5 py-1 text-xs text-primary"
                  >
                    <Sparkles className="h-3 w-3" />
                    {domain}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </section>
    </>
  );
}
