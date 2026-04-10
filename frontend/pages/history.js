import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import ScrollReveal from '../components/animations/ScrollReveal';
import StaggerContainer from '../components/animations/StaggerContainer';
import TopicRow from '../components/ui/TopicRow';
import CalendarDay from '../components/ui/CalendarDay';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function parseDateParts(dateStr) {
  const [year, month, day] = dateStr.split('-').map((value) => Number(value));
  return { year, month, day };
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export default function HistoryPage() {
  const [data, setData] = useState({ total: 0, entries: [] });
  const [selected, setSelected] = useState(null);
  const [activeMonth, setActiveMonth] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await api.get('/api/history');
        if (!active) return;
        setData(response.data);
        const newestEntry = response.data.entries?.[0] || null;
        setSelected(newestEntry);
        setActiveMonth(newestEntry ? newestEntry.date.slice(0, 7) : '');
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

  const entriesByDate = useMemo(() => {
    const map = new Map();
    data.entries.forEach((entry) => {
      map.set(entry.date, entry);
    });
    return map;
  }, [data.entries]);

  const monthKeys = useMemo(() => {
    const keys = [...new Set(data.entries.map((entry) => entry.date.slice(0, 7)))];
    return keys.sort((a, b) => (a > b ? -1 : 1));
  }, [data.entries]);

  const activeMonthIndex = useMemo(
    () => Math.max(0, monthKeys.indexOf(activeMonth)),
    [activeMonth, monthKeys]
  );

  const monthCalendar = useMemo(() => {
    if (!activeMonth) return [];
    const [year, month] = activeMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
    const cells = [];

    for (let i = 0; i < mondayBasedOffset; i += 1) {
      cells.push({ empty: true, id: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        id: date,
        date,
        day,
        entry: entriesByDate.get(date) || null,
      });
    }

    return cells;
  }, [activeMonth, entriesByDate]);

  const monthEntries = useMemo(() => {
    if (!activeMonth) return [];
    return data.entries.filter((entry) => entry.date.startsWith(activeMonth));
  }, [activeMonth, data.entries]);

  const visibleEntries = selected
    ? [selected]
    : monthEntries.length
      ? monthEntries
      : data.entries;

  const activityBars = useMemo(() => {
    const values = monthEntries.map((entry) => Math.max(1, entry.topicCount || 0));
    if (!values.length) return [15, 20, 12, 18, 22, 16, 19];
    const max = Math.max(...values);
    const padded = [...values, ...Array(Math.max(0, 7 - values.length)).fill(Math.round(max * 0.35))].slice(0, 7);
    return padded.map((value) => Math.max(18, Math.round((value / max) * 100)));
  }, [monthEntries]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-on-surface-variant">Loading archive...</div>;
  }

  return (
    <>
      <PageHeader
        label="Archive"
        title="Chronological Archive"
        meta={`${data.total} days of intelligence  |  retracing your revision timeline`}
      />
      <section className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <div className="space-y-5">
          <div className="glass-panel relative overflow-hidden rounded-[30px] border p-5 md:p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative mb-6 flex items-center justify-between">
              <h2 className="font-headline text-2xl text-primary">{formatMonthLabel(activeMonth || monthKeys[0] || '')}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="tap-target inline-flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant bg-surface-mid text-on-surface-variant hover:text-primary"
                  onClick={() => {
                    const nextIndex = Math.min(monthKeys.length - 1, activeMonthIndex + 1);
                    setActiveMonth(monthKeys[nextIndex]);
                    setSelected(null);
                  }}
                  disabled={activeMonthIndex >= monthKeys.length - 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="tap-target inline-flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant bg-surface-mid text-on-surface-variant hover:text-primary"
                  onClick={() => {
                    const prevIndex = Math.max(0, activeMonthIndex - 1);
                    setActiveMonth(monthKeys[prevIndex]);
                    setSelected(null);
                  }}
                  disabled={activeMonthIndex <= 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/80">
              {WEEK_DAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {monthCalendar.map((cell) => (
                <CalendarDay
                  key={cell.id}
                  day={cell.day}
                  entry={cell.entry}
                  empty={cell.empty}
                  compact
                  selected={selected?.date === cell.date}
                  onSelect={(entry) => {
                    if (!entry) return;
                    setSelected(entry);
                  }}
                />
              ))}
            </div>
          </div>

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
              <span>Start</span>
              <span>Mid</span>
              <span>End</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-headline text-3xl text-on-surface">
                {selected ? `Intel Briefing: ${selected.date}` : `Intel Briefings: ${formatMonthLabel(activeMonth)}`}
              </h3>
              <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                {selected ? `${selected.topicCount || 0} topics synthesized` : `${monthEntries.length} active day(s)`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="tap-target inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-mid px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant hover:text-primary"
            >
              <Filter className="h-3.5 w-3.5" />
              Show Month
            </button>
          </div>

          <StaggerContainer className="space-y-4">
            {visibleEntries.map((entry) => (
              <ScrollReveal key={entry.date}>
                <article className="glass-panel rounded-[26px] border p-5 md:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-headline text-2xl text-on-surface">{entry.date}</h3>
                    <span className="rounded-full border border-outline-variant px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
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
