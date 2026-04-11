import '../styles/globals.css'
import Head from 'next/head'
import AuthGuard from '../components/auth/AuthGuard'
import AppShell from '../components/layout/AppShell'
import { ThemeProvider } from '../lib/theme'
import MagazineLoader from '../components/animations/MagazineLoader'

export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <MagazineLoader />
      <Head>
        <title>Civil Lens</title>
      </Head>
      <AuthGuard>
        <AppShell>
          <Component {...pageProps} />
        </AppShell>
      </AuthGuard>
    </ThemeProvider>
  )
}
