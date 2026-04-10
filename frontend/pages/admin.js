import { useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * SECURITY NOTE:
 * - Admin key is NEVER sent from frontend
 * - Admin operations are restricted to trusted networks (no frontend access)
 * - This page is for viewing scheduler status only
 * - Actual admin control requires direct API access with valid key
 */

export default function Admin() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  // Note: Admin key is NOT collected from frontend
  // It must be provided via HTTP header from trusted source
  const handleStopRequest = async (e) => {
    e.preventDefault()
    setShowWarning(false)
    setMessage('')
    setLoading(true)

    try {
      // Attempt to stop scheduler
      // This will fail with 403 unless valid x-admin-key header is provided
      const response = await axios.post(
        `${API_URL}/api/admin/stop`,
        {},
        {
          headers: {
            'x-admin-key': 'INVALID' // Placeholder - should fail
          }
        }
      )

      setMessage(`⚠️ This action requires proper authorization`)
    } catch (error) {
      if (error.response?.status === 403) {
        setMessage('🔒 Admin access denied. Contact system administrator.')
      } else {
        setMessage(`Error: ${error.response?.data?.error || error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-4xl font-bold mb-8">Admin Panel</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Status Information */}
        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-2xl font-bold mb-6">📊 Scheduler Status</h3>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                ℹ️ Scheduler status is available via API endpoint
              </p>
              <code className="text-xs bg-white p-2 rounded mt-2 block text-gray-700">
                GET /api/admin/status
              </code>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Requirements:</h4>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                <li>x-admin-key header with valid key</li>
                <li>Access from trusted network</li>
                <li>Use curl, Postman, or API client</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-2xl font-bold mb-6">🔐 Admin Controls</h3>

          <div className="space-y-4">
            <button
              onClick={() => setShowWarning(!showWarning)}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              {showWarning ? 'Cancel' : '🛑 Request Scheduler Stop'}
            </button>

            {showWarning && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold mb-3">
                  ⚠️ This action requires admin authorization
                </p>
                <p className="text-sm text-red-700 mb-4">
                  To stop the scheduler, you must provide the admin key via API request.
                  Frontend access is disabled for security.
                </p>
                <button
                  onClick={handleStopRequest}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Processing...' : 'Proceed (Admin Key Required)'}
                </button>
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('denied') || message.includes('Error')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Information */}
      <div className="mt-8 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-yellow-900">🔒 Security Information</h3>

        <div className="space-y-4 text-sm text-yellow-800">
          <div>
            <p className="font-semibold mb-2">Admin Key Protection</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Admin keys are NEVER accepted from the frontend</li>
              <li>All admin operations require backend API access</li>
              <li>Keys must be provided via secure HTTP headers</li>
              <li>Invalid attempts are logged and rate-limited</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-2">Stop Scheduler (API Method)</p>
            <code className="bg-white p-3 rounded block text-xs overflow-auto">
{`curl -X POST http://localhost:3000/api/admin/stop \\
  -H "x-admin-key: YOUR_ADMIN_SECRET_HERE"`}
            </code>
          </div>

          <div>
            <p className="font-semibold mb-2">Check Status (API Method)</p>
            <code className="bg-white p-3 rounded block text-xs overflow-auto">
{`curl http://localhost:3000/api/admin/status \\
  -H "x-admin-key: YOUR_ADMIN_SECRET_HERE" | jq`}
            </code>
          </div>

          <div className="bg-white p-3 rounded mt-4">
            <p className="font-semibold mb-2">Best Practices</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Admin key stored only in backend .env</li>
              <li>Never share admin key via email or chat</li>
              <li>Rotate keys periodically</li>
              <li>Use API clients (curl, Postman) for admin tasks</li>
              <li>Monitor admin action logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
