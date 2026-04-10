import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const IMPORTANCE_DOT = {
  HIGH:   'bg-red-400',
  MEDIUM: 'bg-amber-400',
  LOW:    'bg-slate-500',
}

const CATEGORY_STYLES = {
  Environment: 'text-emerald-400',
  Polity:      'text-blue-400',
  Economy:     'text-yellow-400',
  IR:          'text-purple-400',
  Science:     'text-cyan-400',
  Reports:     'text-orange-400',
}

export default function History() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_URL}/api/history`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <span className="text-on-surface-variant text-sm">Loading history...</span>
      </div>
    )
  }

  if (!data) return null

  const { total, entries } = data

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-10">
        <p className="text-on-surface-variant text-sm uppercase tracking-widest mb-2 font-body">Archive</p>
        <h1 className="font-headline text-4xl text-on-surface font-light">History</h1>
        <p className="text-on-surface-variant text-sm mt-2">{total} {total === 1 ? 'day' : 'days'} of intelligence</p>
      </div>

      {entries.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 text-center">
          <p className="text-on-surface-variant">No historical data yet.</p>
          <p className="text-outline text-sm mt-2">Run the daily job to generate entries.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {entries.map(entry => (
            <div key={entry.date} className="glass-panel rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-headline text-xl text-on-surface">{entry.date}</h2>
                <span className="text-xs text-on-surface-variant border border-outline-variant px-3 py-1 rounded-full">
                  {entry.topicCount} topics
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {entry.topics?.map(topic => (
                  <Link key={topic.id} href={`/topic/${topic.id}?date=${entry.date}`}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-high transition-colors cursor-pointer group border border-transparent hover:border-outline-variant/30">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${IMPORTANCE_DOT[topic.importance] || 'bg-slate-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{topic.title}</p>
                        <p className={`text-xs mt-0.5 ${CATEGORY_STYLES[topic.category] || 'text-on-surface-variant'}`}>{topic.category}</p>
                      </div>
                      <span className="text-outline text-xs group-hover:text-primary transition-colors">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
