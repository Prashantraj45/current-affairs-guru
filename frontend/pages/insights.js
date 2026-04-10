import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function InsightCard({ title, items, accentClass, icon }) {
  if (!items?.length) return null
  return (
    <section className="glass-panel rounded-xl p-6">
      <h3 className={`text-xs uppercase tracking-widest font-body mb-4 ${accentClass}`}>{icon} {title}</h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-on-surface-variant text-sm leading-relaxed">
            <span className={`mt-1 flex-shrink-0 text-xs ${accentClass}`}>◆</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Insights() {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_URL}/api/insights`)
      .then(r => setInsights(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <span className="text-on-surface-variant text-sm">Loading insights...</span>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="glass-panel rounded-xl p-10 text-center">
          <p className="text-on-surface-variant">No insights yet.</p>
          <p className="text-outline text-sm mt-2">Run the daily job to populate intelligence memory.</p>
        </div>
      </div>
    )
  }

  const hasAnyData = insights.trends?.length || insights.recurringThemes?.length ||
                     insights.strategyNotes?.length || insights.highPriorityDomains?.length

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-10">
        <p className="text-on-surface-variant text-sm uppercase tracking-widest mb-2 font-body">Intelligence Memory</p>
        <h1 className="font-headline text-4xl text-on-surface font-light">Insights</h1>
        <p className="text-on-surface-variant text-sm mt-2">Cross-day UPSC pattern analysis</p>
      </div>

      {!hasAnyData ? (
        <div className="glass-panel rounded-xl p-10 text-center">
          <p className="text-on-surface-variant">Insights will appear after the daily job runs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Domains first — highest priority */}
          {insights.highPriorityDomains?.length > 0 && (
            <section className="glass-panel rounded-xl p-6">
              <h3 className="text-xs uppercase tracking-widest font-body mb-4 text-primary">🎯 Priority Domains</h3>
              <div className="flex flex-wrap gap-2">
                {insights.highPriorityDomains.map((d, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
                    {d}
                  </span>
                ))}
              </div>
            </section>
          )}

          <InsightCard
            title="Key Trends"
            items={insights.trends}
            accentClass="text-tertiary"
            icon="📈"
          />

          <InsightCard
            title="Recurring Themes"
            items={insights.recurringThemes}
            accentClass="text-secondary"
            icon="🔄"
          />

          <InsightCard
            title="Exam Strategy"
            items={insights.strategyNotes}
            accentClass="text-amber-400"
            icon="💡"
          />
        </div>
      )}
    </div>
  )
}
