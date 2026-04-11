import { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import Head from 'next/head';

export default function SupportPage() {
  const formRef = useRef(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      await emailjs.sendForm(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        formRef.current,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
      );
      setStatus('success');
      formRef.current.reset();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err?.text || 'Failed to send. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Support — Civil Lens</title>
      </Head>
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="glass-panel w-full max-w-lg rounded-panel border p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-headline text-2xl text-on-surface">Get in Touch</h1>
              <p className="text-sm text-on-surface-variant">
                Feedback, bugs, or just want to say hi?
              </p>
            </div>
          </div>

          {status === 'success' ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-400" />
              <p className="text-base font-medium text-on-surface">Message sent!</p>
              <p className="text-sm text-on-surface-variant">
                I&apos;ll get back to you as soon as I can.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-2 rounded-lg border border-outline-variant px-4 py-2 text-sm text-on-surface hover:bg-surface-mid"
              >
                Send another
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface-variant" htmlFor="from_name">
                  Name
                </label>
                <input
                  id="from_name"
                  name="from_name"
                  type="text"
                  required
                  placeholder="Your name"
                  className="rounded-lg border border-outline-variant bg-surface-mid px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/60 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface-variant" htmlFor="from_email">
                  Email
                </label>
                <input
                  id="from_email"
                  name="from_email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="rounded-lg border border-outline-variant bg-surface-mid px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/60 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface-variant" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  rows={4}
                  placeholder="What's on your mind?"
                  className="resize-none rounded-lg border border-outline-variant bg-surface-mid px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/60 focus:outline-none"
                />
              </div>

              {status === 'error' && (
                <p className="text-xs text-red-400">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-60"
              >
                {status === 'sending' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
