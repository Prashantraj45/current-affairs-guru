import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import ScrollReveal from '../components/animations/ScrollReveal';
import StaggerContainer from '../components/animations/StaggerContainer';
import TopicCard from '../components/ui/TopicCard';
import CalendarDay from '../components/ui/CalendarDay';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function HistoryPage() {
  const [allEntries, setAllEntries] = useState([]);
  const [activeMonth, setActiveMonth] = useState('');
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [rangeEntries, setRangeEntries] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load full history index (lightweight)
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await api.get('/api/history');
        if (!active) return;
        setAllEntries(response.data.entries || []);
        const newest = response.data.entries?.[0];
        setActiveMonth(newest ? newest.date.slice(0, 7) : '');
        if (newest) setRangeStart(newest.date);
      } catch {
        if (active) setAllEntries([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  // Fetch range entries from API when range changes
  useEffect(() => {
    if (!rangeStart) return;
    let active = true;
    async function loadRange() {
      setRangeLoading(true);
      try {
        const params = rangeEnd && rangeEnd !== rangeStart
          ? `?start=${rangeStart}&end=${rangeEnd}`
          : `?start=${rangeStart}&end=${rangeStart}`;
        const response = await api.get(`/api/history${params}`);
        if (active) setRangeEntries(response.data.entries || []);
      } catch {
        if (active) setRangeEntries([]);
      } finally {
        if (active) setRangeLoading(false);
      }
    }
    loadRange();
    return () => { active = false; };
  }, [rangeStart, rangeEnd]);

  const entriesByDate = useMemo(() => {
    const map = new Map();
    allEntries.forEach((e) => map.set(e.date, e));
    return map;
  }, [allEntries]);

  const monthKeys = useMemo(() => {
    const keys = [...new Set(allEntries.map((e) => e.date.slice(0, 7)))];
    return keys.sort((a, b) => (a > b ? -1 : 1));
  }, [allEntries]);

  const activeMonthIndex = useMemo(
    () => Math.max(0, monthKeys.indexOf(activeMonth)),
    [activeMonth, monthKeys]
  );

  const monthCalendar = useMemo(() => {
    if (!activeMonth) return [];
    const [year, month] = activeMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const offset = (firstDay.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push({ empty: true, id: `empty-${i}` });
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ id: date, date, day, entry: entriesByDate.get(date) || null });
    }
    return cells;
  }, [activeMonth, entriesByDate]);

  const monthEntries = useMemo(
    () => allEntries.filter((e) => e.date.startsWith(activeMonth)),
    [activeMonth, allEntries]
  );

  const activityBars = useMemo(() => {
    const values = monthEntries.map((e) => Math.max(1, e.topicCount || 0));
    if (!values.length) return [15, 20, 12, 18, 22, 16, 19];
    const max = Math.max(...values);
    const padded = [...values, ...Array(Math.max(0, 7 - values.length)).fill(Math.round(max * 0.35))].slice(0, 7);
    return padded.map((v) => Math.max(18, Math.round((v / max) * 100)));
  }, [monthEntries]);

  const handleDaySelect = useCallback((entry) => {
    if (!entry) return;
    const date = entry.date;
    // If no start, or clearing, set start
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
      return;
    }
    // If start set, no end yet — set end (swap if before start)
    if (date === rangeStart) {
      setRangeStart(null);
      setRangeEnd(null);
      return;
    }
    if (date < rangeStart) {
      setRangeEnd(rangeStart);
      setRangeStart(date);
    } else {
      setRangeEnd(date);
    }
  }, [rangeStart, rangeEnd]);

  const clearRange = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setRangeEntries([]);
  };

  const isInRange = (date) => {
    if (!rangeStart) return false;
    if (!rangeEnd) return date === rangeStart;
    return date >= rangeStart && date <= rangeEnd;
  };

  const rangeLabel = rangeEnd && rangeEnd !== rangeStart
    ? `${rangeStart} → ${rangeEnd}`
    : rangeStart
    ? rangeStart
    : null;

  if (loading) {
    return <div className="py-16 text-center text-sm text-on-surface-variant">Loading archive...</div>;
  }

  return (
    <>
      <PageHeader
        label="Intelligence Chronicle"
        title="Policy Timeline"
        meta={`${allEntries.length} days of intelligence`}
      />
      <section className="grid gap-6 xl:grid-cols-[430px_1fr]">
        {/* Calendar column */}
        <div className="space-y-5">
          <div className="glass-panel relative overflow-hidden rounded-[30px] border p-5 md:p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative mb-6 flex items-center justify-between">
              <h2 className="font-headline text-2xl text-primary">{formatMonthLabel(activeMonth || monthKeys[0] || '')}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="tap-target inline-flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant bg-surface-mid text-on-surface-variant hover:text-primary"
                  onClick={() => { setActiveMonth(monthKeys[Math.min(monthKeys.length - 1, activeMonthIndex + 1)]); }}
                  disabled={activeMonthIndex >= monthKeys.length - 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="tap-target inline-flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant bg-surface-mid text-on-surface-variant hover:text-primary"
                  onClick={() => { setActiveMonth(monthKeys[Math.max(0, activeMonthIndex - 1)]); }}
                  disabled={activeMonthIndex <= 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/80">
              {WEEK_DAYS.map((d) => <span key={d}>{d}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {monthCalendar.map((cell) => (
                <CalendarDay
                  key={cell.id}
                  day={cell.day}
                  entry={cell.entry}
                  empty={cell.empty}
                  compact
                  selected={cell.date ? isInRange(cell.date) : false}
                  onSelect={handleDaySelect}
                />
              ))}
            </div>

            {/* Range hint */}
            <p className="mt-3 text-center text-[11px] text-on-surface-variant">
              {rangeEnd ? 'Click a date to start a new range' : rangeStart ? 'Click a second date to set range end' : 'Click a date to select'}
            </p>
          </div>

          {/* Range badge */}
          {rangeLabel && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3"
            >
              <span className="text-sm font-medium text-primary">{rangeLabel}</span>
              <button type="button" onClick={clearRange} className="text-on-surface-variant hover:text-primary">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* Activity bars */}
          <div className="glass-panel rounded-[28px] border p-5">
            <h3 className="mb-3 text-xs uppercase tracking-[0.18em] text-on-surface-variant">Activity Insight</h3>
            <div className="flex h-24 items-end gap-2 px-1">
              {activityBars.map((height, idx) => (
                <div
                  key={`${height}-${idx}`}
                  style={{ height: `${height}%` }}
                  className={`flex-1 rounded-t-md ${idx === 3 ? 'bg-primary/60' : 'bg-primary/22'}`}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wide text-on-surface-variant">
              <span>Start</span><span>Mid</span><span>End</span>
            </div>
          </div>
        </div>

        {/* Topics column */}
        <div className="space-y-4">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-headline text-3xl text-on-surface">
                {rangeLabel ? `Policy Brief: ${rangeLabel}` : `Policy Briefs: ${formatMonthLabel(activeMonth)}`}
              </h3>
              <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                {rangeLoading ? 'Loading...' : `${rangeEntries.length} day(s) selected`}
              </p>
            </div>
          </div>

          {rangeLoading ? (
            <div className="py-8 text-center text-sm text-on-surface-variant">Loading...</div>
          ) : rangeEntries.length === 0 ? (
            <div className="glass-panel rounded-[26px] border p-8 text-center text-sm text-on-surface-variant">
              Select a date or range on the calendar
            </div>
          ) : (
            <StaggerContainer className="space-y-8">
              {rangeEntries.map((entry) => (
                <ScrollReveal key={entry.date}>
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <h3 className="font-headline text-2xl text-on-surface">{entry.date}</h3>
                      <span className="rounded-full border border-outline-variant px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
                        {entry.topicCount} topics
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {(entry.topics || []).map((topic, i) => (
                        <TopicCard
                          key={topic.id}
                          topic={topic}
                          date={entry.date}
                          variant={i === 0 ? 'hero' : 'compact'}
                        />
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>
    </>
  );
}
