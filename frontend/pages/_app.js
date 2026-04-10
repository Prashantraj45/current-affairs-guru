import '../styles/globals.css'
import Link from 'next/link'
import { useRouter } from 'next/router'

const NAV_LINKS = [
  { href: '/',         label: 'Dashboard' },
  { href: '/history',  label: 'History'   },
  { href: '/insights', label: 'Insights'  },
  { href: '/admin',    label: 'Admin'     },
]

function MyApp({ Component, pageProps }) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-surface-low/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-headline text-lg text-on-surface tracking-tight hover:text-primary transition-colors">
            UPSC Intelligence
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = router.pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors duration-200 font-body ${
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-high'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main>
        <Component {...pageProps} />
      </main>
    </div>
  )
}

export default MyApp
