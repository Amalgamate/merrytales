import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MailCheck, XCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '@/lib/api';

export function NewsletterAction({ action }: { action: 'confirm' | 'unsubscribe' }) {
  const [params] = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const confirmationToken = params.get('token');
    if (!confirmationToken) { setState('error'); setMessage('This link is incomplete.'); return; }
    apiRequest(`/engagement/newsletter/${action}`, { method: 'POST', body: JSON.stringify({ token: confirmationToken }) })
      .then(() => { setState('success'); setMessage(action === 'confirm' ? 'Your email is confirmed. Welcome to the Merry List.' : 'You have been unsubscribed successfully.'); })
      .catch((error: unknown) => { setState('error'); setMessage(error instanceof Error ? error.message : 'This link could not be completed.'); });
  }, [action, params]);
  return <main className="grid min-h-screen place-items-center bg-[#f8f7fb] p-5 text-[#171735]"><section className="w-full max-w-lg rounded-[30px] border bg-white p-8 text-center shadow-xl sm:p-12">{state === 'loading' ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /> : state === 'success' ? (action === 'confirm' ? <MailCheck className="mx-auto h-14 w-14 text-emerald-600" /> : <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />) : <XCircle className="mx-auto h-14 w-14 text-red-500" />}<h1 className="mt-6 text-3xl font-black">{state === 'loading' ? 'One moment…' : state === 'success' ? (action === 'confirm' ? 'You’re on the list.' : 'Preference updated.') : 'We could not complete that.'}</h1><p className="mt-3 leading-7 text-slate-500">{message || 'We’re securely updating your email preference.'}</p><Link to="/" className="mt-7 inline-flex rounded-full bg-primary px-7 py-3 font-bold text-white">Return to Merry Tales</Link></section></main>;
}
