import { useState } from 'react';
import { Heart, Copy, Check } from 'lucide-react';
import Head from 'next/head';

const UPI_ID = 'your-upi-id@upi'; // replace with your actual UPI ID

export default function DonatePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Support Civil Lens</title>
      </Head>
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="glass-panel w-full max-w-sm rounded-panel border p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Heart className="h-7 w-7" />
          </div>

          <h1 className="font-headline text-3xl text-on-surface">Support Civil Lens</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            If this tool helps your UPSC prep, a small contribution keeps it running.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="rounded-xl border border-outline-variant bg-surface-mid p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/upi-qr.png"
                alt="UPI QR Code"
                width={180}
                height={180}
                className="h-44 w-44 rounded-lg object-contain"
              />
            </div>
          </div>

          <p className="mt-4 text-xs text-on-surface-variant">
            Scan with GPay, PhonePe, Paytm, or any UPI app
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-high px-4 py-2">
            <span className="font-mono text-sm text-on-surface">{UPI_ID}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-1 rounded-md p-1 text-on-surface-variant transition hover:bg-surface-mid hover:text-on-surface"
              aria-label="Copy UPI ID"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-xs text-green-400">UPI ID copied!</p>
          )}
        </div>
      </div>
    </>
  );
}
