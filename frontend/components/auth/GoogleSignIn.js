import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Chrome, Loader2 } from 'lucide-react';
import {
  completeGoogleRedirectSignIn,
  oauthDisabled,
  signInWithGoogle,
} from '../../lib/firebase';

export default function GoogleSignIn() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateRedirectAuth() {
      if (oauthDisabled) return;

      setLoading(true);

      try {
        const result = await completeGoogleRedirectSignIn();
        if (!cancelled && result?.user) {
          router.replace('/');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Could not complete Google sign in.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    hydrateRedirectAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { redirected } = await signInWithGoogle();
      if (redirected) return;
      router.replace('/');
    } catch (e) {
      setError(e?.message || 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <button
        type="button"
        onClick={oauthDisabled ? () => router.replace('/') : onSignIn}
        disabled={loading}
        className="tap-target flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-mid px-5 py-3 text-sm font-semibold text-on-surface transition hover:border-primary/45 hover:text-primary disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
        {oauthDisabled ? 'Continue in Local Mode' : 'Continue with Google'}
      </button>
      {oauthDisabled ? (
        <p className="mt-3 text-xs text-on-surface-variant">OAuth is disabled for local development.</p>
      ) : null}
      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
