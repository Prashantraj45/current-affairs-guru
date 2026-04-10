import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function History() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/history`)
        setEntries(response.data.entries || [])
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  if (loading) return <div className="container mx-auto p-8 text-center">Loading...</div>

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-4xl font-bold mb-8">History</h2>

      {entries.length === 0 ? (
        <p className="text-gray-600">No historical data available</p>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.date} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{entry.date}</h3>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                  {entry.topics?.length || 0} topics
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entry.topics?.slice(0, 6).map((topic) => (
                  <Link key={topic.id} href={`/topic/${topic.id}`}>
                    <div className="bg-gray-50 p-4 rounded hover:bg-gray-100 cursor-pointer transition">
                      <h4 className="font-semibold mb-2 line-clamp-2">{topic.title}</h4>
                      <p className="text-xs text-gray-600">{topic.category}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {entry.topics?.length > 6 && (
                <p className="text-sm text-gray-600 mt-3">
                  +{entry.topics.length - 6} more topics
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
