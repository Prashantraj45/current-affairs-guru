import { BrainCircuit } from 'lucide-react';
import GoogleSignIn from '../components/auth/GoogleSignIn';
import { useTheme } from '../lib/theme';
import { Moon, Sun } from 'lucide-react';

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <button
        type="button"
        className="tap-target absolute right-5 top-5 rounded-full border border-outline-variant bg-surface-mid p-2 text-on-surface"
        onClick={toggleTheme}
      >
        {isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="glass-panel w-full max-w-xl rounded-panel border p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <BrainCircuit className="h-8 w-8 animate-pulseSoft" />
        </div>
        <h1 className="font-headline text-5xl text-on-surface">UPSC Intelligence</h1>
        <p className="mt-2 font-headline text-xl italic text-on-surface-variant">
          Your editorial command center for current affairs.
        </p>
        <div className="mt-8 flex justify-center">
          <GoogleSignIn />
        </div>
      </div>
    </div>
  );
}
