import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CurrentAffairsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/intel-canvas');
  }, [router]);

  return <div className="py-16 text-center text-sm text-on-surface-variant">Opening Intel Canvas...</div>;
}
