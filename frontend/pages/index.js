import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const CATEGORY_STYLES = {
  Environment: { bg: 'bg-emerald-900/50', text: 'text-emerald-300', border: 'border-emerald-700/50' },
  Polity:      { bg: 'bg-blue-900/50',    text: 'text-blue-300',    border: 'border-blue-700/50' },
  Economy:     { bg: 'bg-yellow-900/50',  text: 'text-yellow-300',  border: 'border-yellow-700/50' },
  IR:          { bg: 'bg-purple-900/50',  text: 'text-purple-300',  border: 'border-purple-700/50' },
  Science:     { bg: 'bg-cyan-900/50',    text: 'text-cyan-300',    border: 'border-cyan-700/50' },
  Reports:     { bg: 'bg-orange-900/50',  text: 'text-orange-300',  border: 'border-orange-700/50' },
}

const IMPORTANCE_STYLES = {
  HIGH:   { bg: 'bg-red-900/40',    text: 'text-red-300',    dot: 'bg-red-400' },
  MEDIUM: { bg: 'bg-amber-900/40',  text: 'text-amber-300',  dot: 'bg-amber-400' },
  LOW:    { bg: 'bg-slate-700/40',  text: 'text-slate-400',  dot: 'bg-slate-500' },
}

function CategoryBadge({ category }) {
  const s = CATEGORY_STYLES[category] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-600' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${s.bg} ${s.text} ${s.border}`}>
      {category}
    </span>
  )
}

function ImportanceDot({ importance }) {
  const s = IMPORTANCE_STYLES[importance] || IMPORTANCE_STYLES.LOW
  return <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} />
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`${API_URL}/api/today`)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-on-surface-variant text-sm">Loading intelligence...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="glass-panel rounded-xl p-6 border border-red-900/50 text-red-300">{error}</div>
      </div>
    )
  }

  if (!data) return null

  const topics = data.topics || []
  const heroTopics = topics.slice(0, 3)
  const otherTopics = topics.slice(3)
  const allTags = [...new Set(topics.flatMap(t => t.tags || []))]

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-10">
        <p className="text-on-surface-variant text-sm uppercase tracking-widest mb-2 font-body">Daily Intelligence</p>
        <h1 className="font-headline text-4xl text-on-surface font-light">Today&apos;s Briefing</h1>
        <p className="text-on-surface-variant text-sm mt-2">{data.date} · {topics.length} topics</p>
      </div>

      {/* Hero cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        {heroTopics.map((topic, i) => (
          <Link key={topic.id} href={`/topic/${topic.id}?date=${data.date}`}>
            <div className="glass-panel rounded-xl p-6 hover:border-primary/30 transition-all duration-300 cursor-pointer h-full flex flex-col group">
              <div className="flex items-start justify-between gap-2 mb-4">
                <CategoryBadge category={topic.category} />
                <div className="flex items-center gap-1.5">
                  <ImportanceDot importance={topic.importance} />
                  <span className="text-xs text-on-surface-variant">{topic.importance}</span>
                </div>
              </div>
              <h2 className="font-headline text-lg text-on-surface leading-snug mb-3 group-hover:text-primary transition-colors">
                {topic.title}
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed flex-1 line-clamp-3">
                {topic.summary}
              </p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-outline">Score {topic.score}/100</span>
                <span className="text-primary text-xs group-hover:translate-x-1 transition-transform inline-block">Read →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* More topics list */}
      {otherTopics.length > 0 && (
        <div className="mb-12">
          <h2 className="text-on-surface-variant text-xs uppercase tracking-widest mb-4 font-body">More Topics</h2>
          <div className="space-y-2">
            {otherTopics.map(topic => (
              <Link key={topic.id} href={`/topic/${topic.id}?date=${data.date}`}>
                <div className="glass-panel rounded-lg px-5 py-4 flex items-center gap-4 hover:border-primary/20 transition-all cursor-pointer group">
                  <ImportanceDot importance={topic.importance} />
                  <div className="flex-1 min-w-0">
                    <span className="text-on-surface font-medium group-hover:text-primary transition-colors">{topic.title}</span>
                    <p className="text-on-surface-variant text-xs mt-0.5 truncate">{topic.summary}</p>
                  </div>
                  <CategoryBadge category={topic.category} />
                  <span className="text-outline text-sm group-hover:text-primary transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tags cloud */}
      {allTags.length > 0 && (
        <div>
          <h2 className="text-on-surface-variant text-xs uppercase tracking-widest mb-3 font-body">Syllabus Coverage</h2>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
