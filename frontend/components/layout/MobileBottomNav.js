import Link from 'next/link';
import { useRouter } from 'next/router';
import { BookOpenText, Clock3, Compass, House } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Synthesize', Icon: House },
  { href: '/history', label: 'Archive', Icon: Clock3 },
  { href: '/intel-canvas', label: 'Canvas', Icon: BookOpenText },
  { href: '/core', label: 'Core', Icon: Compass },
];

export default function MobileBottomNav() {
  const router = useRouter();
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant bg-surface/90 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = router.pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`tap-target flex flex-1 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[11px] transition ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <Icon className={`h-4 w-4 transition ${active ? 'scale-110' : ''}`} />
              <span className="mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
