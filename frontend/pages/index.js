import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchToday()
  }, [])

  const fetchToday = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/today`)
      setData(response.data)
      setError(null)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="container mx-auto p-8 text-center">Loading...</div>
  if (error) return <div className="container mx-auto p-8 text-red-600">Error: {error}</div>
  if (!data) return <div className="container mx-auto p-8 text-center">No data available</div>

  const topics = data.topics || []
  const heroTopics = topics.slice(0, 3)
  const otherTopics = topics.slice(3)

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-4xl font-bold mb-8">Today's Intelligence</h2>

      {/* Hero Topics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {heroTopics.map((topic) => (
          <Link key={topic.id} href={`/topic/${topic.id}`}>
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl cursor-pointer transition">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold flex-1">{topic.title}</h3>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm ml-2">
                  {topic.upsc_relevance_score}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-3">{topic.category}</p>
              <p className="text-gray-700">{topic.explanation.substring(0, 100)}...</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Other Topics */}
      {otherTopics.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold mb-6">More Topics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherTopics.map((topic) => (
              <Link key={topic.id} href={`/topic/${topic.id}`}>
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold flex-1">{topic.title}</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs ml-2">
                      {topic.upsc_relevance_score}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{topic.category}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 text-center text-gray-600">
        <p>Total Topics: {topics.length}</p>
        <p className="text-sm mt-2">Last Updated: {data.date}</p>
      </div>
    </div>
  )
}
