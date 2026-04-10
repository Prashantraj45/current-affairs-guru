import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const CATEGORY_STYLES = {
  Environment: { bg: 'bg-emerald-900/50', text: 'text-emerald-300', border: 'border-emerald-700/50' },
  Polity:      { bg: 'bg-blue-900/50',    text: 'text-blue-300',    border: 'border-blue-700/50' },
  Economy:     { bg: 'bg-yellow-900/50',  text: 'text-yellow-300',  border: 'border-yellow-700/50' },
  IR:          { bg: 'bg-purple-900/50',  text: 'text-purple-300',  border: 'border-purple-700/50' },
  Science:     { bg: 'bg-cyan-900/50',    text: 'text-cyan-300',    border: 'border-cyan-700/50' },
  Reports:     { bg: 'bg-orange-900/50',  text: 'text-orange-300',  border: 'border-orange-700/50' },
}

function Section({ title, children, accent }) {
  return (
    <section className="glass-panel rounded-xl p-6 mb-5">
      <h2 className={`text-xs uppercase tracking-widest font-body mb-4 ${accent || 'text-primary'}`}>{title}</h2>
      {children}
    </section>
  )
}

export default function TopicDetail() {
  const router = useRouter()
  const { id, date } = router.query
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    const url = date ? `${API_URL}/api/topic/${id}?date=${date}` : `${API_URL}/api/topic/${id}`
    axios.get(url)
      .then(r => setTopic(r.data))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [id, date])

  if (loading) {
    return <div className="flex items-center justify-center min-h-96"><span className="text-on-surface-variant text-sm">Loading...</span></div>
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="glass-panel rounded-xl p-6 border border-red-900/50 text-red-300 mb-4">{error}</div>
        <Link href="/" className="text-primary text-sm hover:underline">← Back to Dashboard</Link>
      </div>
    )
  }

  if (!topic) return null

  const catStyle = CATEGORY_STYLES[topic.category] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-600' }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/" className="text-on-surface-variant text-sm hover:text-primary transition-colors inline-flex items-center gap-1 mb-8">
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs font-medium px-3 py-1 rounded border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
            {topic.category}
          </span>
          <span className="text-xs px-3 py-1 rounded border border-primary/30 bg-primary/10 text-primary">
            Score {topic.score}/100
          </span>
          <span className={`text-xs px-3 py-1 rounded border ${topic.importance === 'HIGH' ? 'border-red-700/50 bg-red-900/40 text-red-300' : topic.importance === 'MEDIUM' ? 'border-amber-700/50 bg-amber-900/40 text-amber-300' : 'border-slate-600 bg-slate-800/40 text-slate-400'}`}>
            {topic.importance}
          </span>
        </div>
        <h1 className="font-headline text-3xl text-on-surface font-normal leading-tight">{topic.title}</h1>
        {topic.date && <p className="text-on-surface-variant text-xs mt-2">{topic.date}</p>}
      </div>

      {/* Summary */}
      {topic.summary && (
        <div className="rounded-xl p-5 mb-5 border border-primary/20 bg-primary/5">
          <p className="text-on-surface leading-relaxed">{topic.summary}</p>
        </div>
      )}

      {/* Why in News */}
      <Section title="Why in News">
        <p className="text-on-surface-variant leading-relaxed">{topic.why_in_news}</p>
      </Section>

      {/* Key Facts */}
      {topic.facts?.length > 0 && (
        <Section title="Key Facts" accent="text-tertiary">
          <ul className="space-y-2">
            {topic.facts.map((fact, i) => (
              <li key={i} className="flex gap-3 text-on-surface-variant">
                <span className="text-tertiary mt-0.5 flex-shrink-0">◆</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Explanation */}
      <Section title="Explanation">
        <div className="text-on-surface-variant whitespace-pre-line leading-relaxed">{topic.explanation}</div>
      </Section>

      {/* Prelims */}
      <Section title="For Prelims" accent="text-secondary">
        {topic.prelims?.key_facts?.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-outline uppercase tracking-wide mb-3">Key Facts</p>
            <ul className="space-y-2">
              {topic.prelims.key_facts.map((f, i) => (
                <li key={i} className="flex gap-2 text-on-surface-variant text-sm">
                  <span className="text-secondary">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {topic.prelims?.mcq && (
          <div className="rounded-lg p-4 bg-surface-mid border border-outline-variant/30">
            <p className="text-xs text-outline uppercase tracking-wide mb-3">Sample MCQ</p>
            <p className="text-on-surface font-medium mb-4">{topic.prelims.mcq.question}</p>
            <div className="space-y-2">
              {topic.prelims.mcq.options?.map((opt, i) => (
                <label key={i} className="flex items-center gap-3 p-2 rounded hover:bg-surface-high cursor-pointer transition-colors">
                  <input type="radio" name={`mcq-${topic.id}`} className="accent-primary" />
                  <span className="text-on-surface-variant text-sm">{opt}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-outline">
              Answer: <span className="text-secondary font-semibold">{topic.prelims.mcq.answer}</span>
            </p>
          </div>
        )}
      </Section>

      {/* Mains */}
      <Section title="For Mains" accent="text-purple-400">
        <div className="flex gap-2 mb-4">
          <span className="text-xs px-3 py-1 rounded border border-purple-700/50 bg-purple-900/40 text-purple-300">
            {topic.mains?.gs_paper}
          </span>
        </div>
        <p className="text-on-surface font-medium mb-5">{topic.mains?.question}</p>
        {topic.mains?.answer_framework && (
          <div className="space-y-4 border-l-2 border-purple-800/50 pl-4">
            <div>
              <span className="text-xs text-purple-400 uppercase tracking-wide">Introduction</span>
              <p className="text-on-surface-variant text-sm mt-1">{topic.mains.answer_framework.intro}</p>
            </div>
            {topic.mains.answer_framework.body?.length > 0 && (
              <div>
                <span className="text-xs text-purple-400 uppercase tracking-wide">Body</span>
                <ul className="mt-2 space-y-1">
                  {topic.mains.answer_framework.body.map((pt, i) => (
                    <li key={i} className="flex gap-2 text-on-surface-variant text-sm"><span className="text-purple-600">•</span>{pt}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <span className="text-xs text-purple-400 uppercase tracking-wide">Conclusion</span>
              <p className="text-on-surface-variant text-sm mt-1">{topic.mains.answer_framework.conclusion}</p>
            </div>
          </div>
        )}
      </Section>

      {/* Tags */}
      {topic.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {topic.tags.map(tag => (
            <span key={tag} className="text-xs px-3 py-1 rounded-full border border-outline-variant text-on-surface-variant">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Revision Note */}
      <div className="rounded-xl p-5 border border-tertiary/30 bg-tertiary/5">
        <p className="text-xs text-tertiary uppercase tracking-widest mb-2">⚡ Quick Revision</p>
        <p className="text-on-surface leading-relaxed">{topic.revision_note}</p>
      </div>
    </div>
  )
}
