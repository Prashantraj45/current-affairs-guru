import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Insights() {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/insights`)
        setInsights(response.data)
      } catch (error) {
        console.error('Error fetching insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  if (loading) return <div className="container mx-auto p-8 text-center">Loading...</div>
  if (!insights) return <div className="container mx-auto p-8 text-center">No insights available</div>

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-4xl font-bold mb-8">System Insights</h2>

      {/* High Priority Domains */}
      {insights.high_priority_domains && (
        <section className="mb-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-2xl font-bold mb-4">🎯 High Priority Domains</h3>
          <div className="flex flex-wrap gap-3">
            {insights.high_priority_domains.map((domain, i) => (
              <span key={i} className="bg-blue-100 text-blue-800 px-4 py-2 rounded">
                {domain}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Key Trends */}
      {insights.key_trends && (
        <section className="mb-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-2xl font-bold mb-4">📈 Key Trends</h3>
          <ul className="list-disc list-inside space-y-3">
            {insights.key_trends.map((trend, i) => (
              <li key={i} className="text-gray-700">{trend}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Recurring Topics */}
      {insights.recurring_topics && (
        <section className="mb-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-2xl font-bold mb-4">🔄 Recurring Topics</h3>
          <ul className="list-disc list-inside space-y-3">
            {insights.recurring_topics.map((topic, i) => (
              <li key={i} className="text-gray-700">{topic}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Strategy Notes */}
      {insights.strategy_notes && (
        <section className="mb-8 bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
          <h3 className="text-2xl font-bold mb-4">💡 Exam Strategy Notes</h3>
          <ul className="list-disc list-inside space-y-3">
            {insights.strategy_notes.map((note, i) => (
              <li key={i} className="text-gray-700">{note}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
