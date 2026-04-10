import { useRouter } from 'next/router';
import { useState } from 'react';
import { Chrome, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '../../lib/firebase';

export default function GoogleSignIn() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
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
        onClick={onSignIn}
        disabled={loading}
        className="tap-target flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-mid px-5 py-3 text-sm font-semibold text-on-surface transition hover:border-primary/45 hover:text-primary disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
        Continue with Google
      </button>
      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
