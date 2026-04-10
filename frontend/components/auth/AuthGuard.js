import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Loader2 } from 'lucide-react';
import { auth, oauthDisabled } from '../../lib/firebase';

function GuardWithFirebase({ children }) {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const isLoginPage = router.pathname === '/login';

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginPage) router.replace('/login');
    if (user && isLoginPage) router.replace('/');
  }, [isLoginPage, loading, router, user]);

  if (!auth) return children;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isLoginPage) return null;
  return children;
}

export default function AuthGuard({ children }) {
  if (oauthDisabled || !auth) return children;
  return <GuardWithFirebase>{children}</GuardWithFirebase>;
}
