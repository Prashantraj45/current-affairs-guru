import { useRouter } from 'next/router';
import TopNav from './TopNav';
import MobileBottomNav from './MobileBottomNav';

export default function AppShell({ children }) {
  const router = useRouter();
  const isLogin = router.pathname === '/login';

  if (isLogin) {
    return <main>{children}</main>;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 md:px-6 md:pt-8 lg:pb-10">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
