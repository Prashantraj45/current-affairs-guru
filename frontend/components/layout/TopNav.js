import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { BrainCircuit, LogOut, Moon, Search, Sun } from 'lucide-react';
import { auth, signOutUser } from '../../lib/firebase';
import { useTheme } from '../../lib/theme';
import { NAV_LINKS } from '../../lib/constants';

function ThemeSlider() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="tap-target relative h-8 w-16 rounded-full border border-outline-variant bg-surface-high/90 p-[3px]"
      aria-label="Toggle theme"
    >
      <span
        className={`absolute inset-y-[3px] left-[3px] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary text-on-primary shadow transition-transform duration-300 ${
          isLight ? 'translate-x-8' : 'translate-x-0'
        }`}
      >
        {isLight ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const initials = useMemo(() => {
    const source = user?.displayName || user?.email || 'U';
    return source
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="tap-target flex items-center gap-2 rounded-full border border-outline-variant bg-surface-mid px-1.5 py-1"
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="User avatar" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary">
            {initials}
          </span>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-outline-variant bg-surface p-1.5 shadow-xl">
          <button
            type="button"
            className="tap-target flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-mid"
            onClick={async () => {
              await signOutUser();
              setOpen(false);
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function NavContent({ user }) {
  const router = useRouter();
  
  useEffect(() => {
    const openSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        router.push('/search');
      }
    };
    window.addEventListener('keydown', openSearch);
    return () => window.removeEventListener('keydown', openSearch);
  }, [router]);

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="tap-target flex items-center gap-2 text-on-surface">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <BrainCircuit className="h-4 w-4" />
          </span>
          <span className="font-headline text-xl">UPSC Intelligence</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.slice(0, 3).map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`tap-target rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-mid hover:text-on-surface'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {NAV_LINKS.slice(3).map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`tap-target rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-mid hover:text-on-surface'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="tap-target hidden items-center justify-center rounded-full border border-outline-variant bg-surface-mid p-2 text-on-surface-variant transition hover:text-on-surface md:flex lg:hidden"
            onClick={() => router.push('/search')}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="tap-target hidden items-center gap-2 rounded-full border border-outline-variant bg-surface-mid px-3 py-2 text-sm text-on-surface-variant transition hover:text-on-surface lg:flex"
            onClick={() => router.push('/search')}
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <span className="rounded border border-outline-variant px-1.5 py-0.5 text-[10px]">Cmd K</span>
          </button>

          <ThemeSlider />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}

function TopNavWithFirebase() {
  const [user] = useAuthState(auth);
  return <NavContent user={user} />;
}

export default function TopNav() {
  if (!auth) return <NavContent user={null} />;
  return <TopNavWithFirebase />;
}
