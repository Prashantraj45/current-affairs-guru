import '../styles/globals.css'
import Link from 'next/link'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <nav className="bg-blue-600 text-white py-4 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">📚 UPSC AI</h1>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-blue-200">Dashboard</Link>
            <Link href="/history" className="hover:text-blue-200">History</Link>
            <Link href="/insights" className="hover:text-blue-200">Insights</Link>
            <Link href="/admin" className="hover:text-blue-200">Admin</Link>
          </div>
        </div>
      </nav>
      <main className="min-h-screen bg-gray-50">
        <Component {...pageProps} />
      </main>
    </>
  )
}

export default MyApp
