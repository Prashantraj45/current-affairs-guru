import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function TopicDetail() {
  const router = useRouter()
  const { id } = router.query
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchTopic = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/topic/${id}`)
        setTopic(response.data)
      } catch (error) {
        console.error('Error fetching topic:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopic()
  }, [id])

  if (loading) return <div className="container mx-auto p-8 text-center">Loading...</div>
  if (!topic) return <div className="container mx-auto p-8 text-center">Topic not found</div>

  return (
    <div className="container mx-auto p-8">
      <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">← Back to Dashboard</Link>

      <article className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">{topic.title}</h1>
          <div className="flex gap-4 flex-wrap">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
              {topic.category}
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded">
              Relevance: {topic.upsc_relevance_score}/100
            </span>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded">
              {topic.metadata?.importance_tag || 'medium'}
            </span>
          </div>
        </div>

        {/* Why in News */}
        <section className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-3">📰 Why in News?</h2>
          <p className="text-gray-700">{topic.why_in_news}</p>
        </section>

        {/* Core Concept */}
        <section className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-3">🧠 Core Concept</h2>
          <p className="text-gray-700">{topic.core_concept}</p>
        </section>

        {/* Explanation */}
        <section className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-3">📖 Detailed Explanation</h2>
          <p className="text-gray-700">{topic.explanation}</p>
        </section>

        {/* Prelims */}
        <section className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-3">✍️ For Prelims</h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Key Facts:</h3>
            <ul className="list-disc list-inside space-y-2">
              {topic.prelims?.key_facts?.map((fact, i) => (
                <li key={i} className="text-gray-700">{fact}</li>
              ))}
            </ul>
          </div>

          {topic.prelims?.mcq && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-3">Sample MCQ:</h3>
              <p className="mb-3 font-medium">{topic.prelims.mcq.question}</p>
              <div className="space-y-2">
                {topic.prelims.mcq.options?.map((option, i) => (
                  <label key={i} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                    <input type="radio" name="mcq" className="mr-3" />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Answer: <span className="font-semibold">{topic.prelims.mcq.answer}</span>
              </p>
            </div>
          )}
        </section>

        {/* Mains */}
        <section className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-3">📝 For Mains</h2>

          <div className="mb-4">
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded">
              {topic.mains?.gs_paper}
            </span>
          </div>

          <p className="mb-4 font-medium text-lg">{topic.mains?.question}</p>

          {topic.mains?.answer_framework && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-700">Introduction:</h4>
                <p className="text-gray-700 ml-4">{topic.mains.answer_framework.intro}</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-700">Body:</h4>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  {topic.mains.answer_framework.body?.map((point, i) => (
                    <li key={i} className="text-gray-700">{point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-700">Conclusion:</h4>
                <p className="text-gray-700 ml-4">{topic.mains.answer_framework.conclusion}</p>
              </div>
            </div>
          )}
        </section>

        {/* Revision Note */}
        <section className="mb-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-lg font-bold mb-3">⚡ Quick Revision (50 words)</h2>
          <p className="text-gray-700">{topic.revision_note_50_words}</p>
        </section>

        {/* Sources */}
        {topic.sources && topic.sources.length > 0 && (
          <section className="mb-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-3">📚 Sources</h2>
            <ul className="space-y-2">
              {topic.sources.map((source, i) => (
                <li key={i}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {source.name} →
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  )
}
