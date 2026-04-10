import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import ScrollReveal from '../components/animations/ScrollReveal';
import BriefingCard from '../components/ui/BriefingCard';
import StatBar from '../components/ui/StatBar';

function calculateCoverage(domains = []) {
  const total = Math.max(domains.length, 1);
  return domains.map((domain, index) => ({
    domain,
    value: Math.max(20, Math.round(((total - index) / total) * 100)),
  }));
}

export default function InsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await api.get('/api/insights');
        if (active) setInsights(response.data);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const coverage = useMemo(
    () => calculateCoverage(insights?.highPriorityDomains || []),
    [insights?.highPriorityDomains]
  );

  if (loading) return <div className="py-16 text-center text-sm text-on-surface-variant">Loading insights...</div>;

  return (
    <>
      <PageHeader label="Intelligence Memory" title="Insights" meta="Cross-day pattern analysis" />
      <section className="relative overflow-hidden rounded-panel border border-outline-variant bg-surface-mid p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(186,195,255,0.22),transparent_38%),radial-gradient(circle_at_82%_16%,rgba(177,202,215,0.18),transparent_36%)]" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.17em] text-on-surface-variant">Strategic Briefing</p>
          <h2 className="mt-2 max-w-2xl font-headline text-3xl text-on-surface md:text-4xl">
            Track domain pressure, recurring themes, and exam-facing adjustments.
          </h2>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ScrollReveal>
          <BriefingCard
            title="Key Trends"
            items={insights?.trends || []}
            accent="text-primary"
          />
        </ScrollReveal>
        <ScrollReveal>
          <BriefingCard
            title="Recurring Themes"
            items={insights?.recurringThemes || []}
            accent="text-secondary"
          />
        </ScrollReveal>
        <ScrollReveal>
          <BriefingCard
            title="Strategy Notes"
            items={insights?.strategyNotes || []}
            accent="text-tertiary"
          />
        </ScrollReveal>
        <ScrollReveal>
          <section className="glass-panel rounded-panel border p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.17em] text-on-surface-variant">
              Domain Coverage
            </h3>
            <div className="space-y-4">
              {coverage.map((item) => (
                <StatBar key={item.domain} label={item.domain} value={item.value} />
              ))}
            </div>
          </section>
        </ScrollReveal>
      </div>
    </>
  );
}
