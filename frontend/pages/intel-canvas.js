import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Sparkles } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import TopicRow from '../components/ui/TopicRow';
import BriefingCard from '../components/ui/BriefingCard';
import ScrollReveal from '../components/animations/ScrollReveal';
import FunEmptyState from '../components/ui/FunEmptyState';

function monthFromDate(dateStr = '') {
  return dateStr.slice(0, 7);
}

function monthLabel(monthKey) {
  if (!monthKey) return 'Current Month';
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function getMonthDateLimits(monthKey) {
  if (!monthKey) return { min: '', max: '' };
  const [year, month] = monthKey.split('-').map(Number);
  const min = `${year}-${String(month).padStart(2, '0')}-01`;
  const max = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
  return { min, max };
}

export default function IntelCanvasPage() {
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [monthlyInsights, setMonthlyInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState('');

  const [draftStartDate, setDraftStartDate] = useState('');
  const [draftEndDate, setDraftEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  useEffect(() => {
    let active = true;
    async function loadHistory() {
      setHistoryError('');
      try {
        const response = await api.get('/api/history');
        if (!active) return;
        setHistoryEntries(response.data.entries || []);
      } catch (error) {
        if (active) setHistoryError(error?.response?.data?.error || 'Could not load current affairs history.');
      } finally {
        if (active) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadMonthlyIndex() {
      setInsightsError('');
      try {
        const response = await api.get('/api/insights/monthly');
        if (!active) return;
        const monthList = response.data.months || [];
        const initialMonth = response.data.currentMonth || response.data.selectedMonth || monthList[0] || '';
        setMonths(monthList.length ? monthList : [initialMonth].filter(Boolean));
        setSelectedMonth(initialMonth);
        setMonthlyInsights(response.data.insights || null);
      } catch (error) {
        if (active) setInsightsError(error?.response?.data?.error || 'Could not load monthly insights.');
      } finally {
        if (active) setInsightsLoading(false);
      }
    }
    loadMonthlyIndex();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    let active = true;
    async function loadSelectedMonthInsights() {
      setInsightsLoading(true);
      setInsightsError('');
      try {
        const response = await api.get(`/api/insights/monthly/${selectedMonth}`);
        if (active) setMonthlyInsights(response.data);
      } catch (error) {
        if (active) setInsightsError(error?.response?.data?.error || 'Could not refresh selected month insights.');
      } finally {
        if (active) setInsightsLoading(false);
      }
    }
    loadSelectedMonthInsights();
    return () => {
      active = false;
    };
  }, [selectedMonth]);

  const monthEntries = useMemo(
    () => historyEntries.filter((entry) => monthFromDate(entry.date) === selectedMonth),
    [historyEntries, selectedMonth]
  );

  useEffect(() => {
    if (!selectedMonth) return;
    const sourceDates = (monthlyInsights?.sourceDates || []).filter((date) => monthFromDate(date) === selectedMonth);
    const monthDates = monthEntries.map((entry) => entry.date);
    const fallbackDates = sourceDates.length ? sourceDates : monthDates;
    const sorted = [...fallbackDates].sort();
    const start = sorted[0] || getMonthDateLimits(selectedMonth).min;
    const end = sorted[sorted.length - 1] || start;
    setDraftStartDate(start);
    setDraftEndDate(end);
    setAppliedStartDate(start);
    setAppliedEndDate(end);
  }, [selectedMonth, monthlyInsights?.sourceDates, monthEntries]);

  const filteredEntries = useMemo(() => {
    if (!appliedStartDate || !appliedEndDate) return [];
    return monthEntries.filter((entry) => entry.date >= appliedStartDate && entry.date <= appliedEndDate);
  }, [appliedEndDate, appliedStartDate, monthEntries]);

  const totalTopics = useMemo(
    () => filteredEntries.reduce((sum, entry) => sum + (entry.topics?.length || entry.topicCount || 0), 0),
    [filteredEntries]
  );

  const dateLimits = getMonthDateLimits(selectedMonth);

  if (historyLoading && insightsLoading) {
    return <div className="py-16 text-center text-sm text-on-surface-variant">Loading Intel Canvas...</div>;
  }

  return (
    <>
      <PageHeader
        label="Intel Canvas"
        title="Topics + Monthly Insight Deck"
        meta={`${monthLabel(selectedMonth)}  |  ${filteredEntries.length} day(s)  |  ${totalTopics} topic(s)`}
      />

      <section className="mb-5 glass-panel rounded-[26px] border p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Monthly Insights</p>
            <h2 className="font-headline text-3xl text-on-surface">{monthLabel(selectedMonth)} Signal Deck</h2>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-on-surface-variant" htmlFor="month-select">
              Month
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-mid px-3 py-2 text-sm text-on-surface outline-none"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {monthLabel(month)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {insightsError ? (
          <FunEmptyState storageKey="intel-monthly-error" label="Insights API Error" />
        ) : insightsLoading ? (
          <p className="text-sm text-on-surface-variant">Loading monthly insights...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <BriefingCard title="Trends" items={monthlyInsights?.trends || []} accent="text-primary" />
            <BriefingCard title="Strategy Notes" items={monthlyInsights?.strategyNotes || []} accent="text-tertiary" />
            <BriefingCard
              title="Recurring Themes"
              items={monthlyInsights?.recurringThemes || []}
              accent="text-secondary"
            />
            <div className="rounded-panel border border-outline-variant bg-surface-high/60 p-4">
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
            </div>
          </div>
        )}
      </section>

      <section className="mb-5 glass-panel rounded-[26px] border p-5">
        <div className="mb-3 flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-on-surface-variant" />
          <h3 className="font-headline text-2xl text-on-surface">Date Range</h3>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex flex-1 flex-col gap-1 text-xs text-on-surface-variant">
            Start Date
            <input
              type="date"
              min={dateLimits.min}
              max={dateLimits.max}
              value={draftStartDate}
              onChange={(event) => setDraftStartDate(event.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-mid px-3 py-2 text-sm text-on-surface outline-none"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-on-surface-variant">
            End Date
            <input
              type="date"
              min={draftStartDate || dateLimits.min}
              max={dateLimits.max}
              value={draftEndDate}
              onChange={(event) => setDraftEndDate(event.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-mid px-3 py-2 text-sm text-on-surface outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              const safeStart = draftStartDate || dateLimits.min;
              const safeEnd = draftEndDate || safeStart;
              setAppliedStartDate(safeStart);
              setAppliedEndDate(safeEnd < safeStart ? safeStart : safeEnd);
            }}
            className="rounded-lg border border-primary/40 bg-primary/12 px-4 py-2 text-sm font-medium text-primary"
          >
            Apply Range
          </button>
        </div>
      </section>

      {historyError ? (
        <FunEmptyState storageKey="intel-history-error" label="History API Error" />
      ) : filteredEntries.length === 0 ? (
        <FunEmptyState storageKey="intel-empty-range" label="No Topics in Selected Range" />
      ) : (
        <div className="space-y-5">
          {filteredEntries.map((entry) => (
            <ScrollReveal key={entry.date}>
              <section className="glass-panel rounded-[26px] border p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-headline text-3xl text-on-surface">{entry.date}</h2>
                  <span className="rounded-full border border-outline-variant px-3 py-1 text-xs text-on-surface-variant">
                    {(entry.topics || []).length} topics
                  </span>
                </div>
                <div className="space-y-2">
                  {(entry.topics || []).map((topic) => (
                    <TopicRow key={`${entry.date}-${topic.id}`} topic={topic} date={entry.date} />
                  ))}
                </div>
              </section>
            </ScrollReveal>
          ))}
        </div>
      )}
    </>
  );
}
