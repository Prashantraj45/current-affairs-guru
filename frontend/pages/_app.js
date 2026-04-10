import '../styles/globals.css'
import AuthGuard from '../components/auth/AuthGuard'
import AppShell from '../components/layout/AppShell'
import { ThemeProvider } from '../lib/theme'

export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthGuard>
        <AppShell>
          <Component {...pageProps} />
        </AppShell>
      </AuthGuard>
    </ThemeProvider>
  )
}
