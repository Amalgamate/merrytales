import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight, Check, Cookie, Mail, PartyPopper as Sparkles, ShieldCheck, X } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type Consent = { essential: true; preferences: boolean; analytics: boolean; savedAt: string };

export function EngagementOverlays() {
  const location = useLocation();
  const [consent, setConsent] = useState<Consent | null>(() => { try { return JSON.parse(localStorage.getItem('merry_tales_cookie_consent') || 'null'); } catch { return null; } });
  const [showConsent, setShowConsent] = useState(false);
  const [manage, setManage] = useState(false);
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (consent) {
      setShowConsent(false);
      return;
    }

    setShowConsent(false);

    const revealAtPageBottom = () => {
      const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const viewportBottom = window.scrollY + window.innerHeight;
      const bottomThreshold = Math.max(120, window.innerHeight * 0.08);

      if (pageHeight - viewportBottom <= bottomThreshold) {
        setShowConsent(true);
      }
    };

    const frame = window.requestAnimationFrame(revealAtPageBottom);
    window.addEventListener('scroll', revealAtPageBottom, { passive: true });
    window.addEventListener('resize', revealAtPageBottom);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', revealAtPageBottom);
      window.removeEventListener('resize', revealAtPageBottom);
    };
  }, [consent, location.pathname]);

  useEffect(() => {
    if (!consent || localStorage.getItem('merry_tales_newsletter_closed')) return;
    const timer = window.setTimeout(() => setNewsletter(true), 7000);
    return () => window.clearTimeout(timer);
  }, [consent]);

  const saveConsent = (next: Pick<Consent, 'preferences' | 'analytics'>) => {
    const value: Consent = { essential: true, ...next, savedAt: new Date().toISOString() };
    localStorage.setItem('merry_tales_cookie_consent', JSON.stringify(value)); setConsent(value); setManage(false);
  };
  const closeNewsletter = () => { localStorage.setItem('merry_tales_newsletter_closed', new Date().toISOString()); setNewsletter(false); };
  const subscribe = async (event: FormEvent) => {
    event.preventDefault(); if (!email.trim() || sending) return; setSending(true);
    try { await apiRequest('/engagement/newsletter', { method: 'POST', body: JSON.stringify({ email, source: 'WEBSITE_POPUP' }) }); setSubscribed(true); localStorage.setItem('merry_tales_newsletter_closed', 'pending-confirmation'); window.setTimeout(() => setNewsletter(false), 3200); }
    finally { setSending(false); }
  };

  return <>
    {!consent && showConsent && <aside className="fixed inset-x-3 bottom-3 z-[95] mx-auto max-w-5xl rounded-[24px] border border-slate-200 bg-white/95 p-4 text-[#171735] shadow-[0_20px_70px_rgba(16,23,42,.22)] backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in duration-300 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Cookie className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 className="font-extrabold">A better Merry Tales experience, with your permission.</h2><p className="mt-1 text-xs leading-5 text-slate-500">Essential cookies keep the marketplace working. Optional preferences remember your choices, while analytics help us improve discovery.</p>{manage && <div className="mt-4 grid gap-2 sm:grid-cols-3"><label className="flex items-center justify-between rounded-xl border bg-slate-50 p-3 text-xs font-bold">Essential <input type="checkbox" checked disabled className="accent-pink-500" /></label><label className="flex items-center justify-between rounded-xl border p-3 text-xs font-bold">Preferences <input type="checkbox" checked={preferences} onChange={(e) => setPreferences(e.target.checked)} className="accent-pink-500" /></label><label className="flex items-center justify-between rounded-xl border p-3 text-xs font-bold">Analytics <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="accent-pink-500" /></label></div>}</div><div className="flex shrink-0 flex-wrap gap-2"><button onClick={() => saveConsent({ preferences: false, analytics: false })} className="rounded-full border px-4 py-2.5 text-xs font-bold">Essential only</button>{manage ? <button onClick={() => saveConsent({ preferences, analytics })} className="rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white">Save choices</button> : <><button onClick={() => setManage(true)} className="rounded-full border px-4 py-2.5 text-xs font-bold">Manage</button><button onClick={() => saveConsent({ preferences: true, analytics: true })} className="rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white">Accept all</button></>}</div></div></aside>}

    {newsletter && consent && <div className="fixed inset-0 z-[90] grid place-items-center bg-[#10172a]/45 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.currentTarget === e.target) closeNewsletter(); }}><section className="relative grid w-full max-w-3xl overflow-hidden rounded-[30px] bg-white text-[#171735] shadow-[0_30px_90px_rgba(16,23,42,.35)] md:grid-cols-[.9fr_1.1fr]"><button onClick={closeNewsletter} aria-label="Close subscription" className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm"><X className="h-4 w-4" /></button><div className="relative min-h-56 overflow-hidden md:min-h-[440px]"><img src="/campaign/gift-experiences.png" alt="A joyful Merry Tales celebration" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#171735]/80 via-transparent to-transparent" /><div className="absolute bottom-6 left-6 right-6 text-white"><p className="text-xs font-black uppercase tracking-[.18em] text-pink-200">The Merry List</p><p className="mt-2 text-2xl font-black">Good events begin with good ideas.</p></div></div><div className="flex flex-col justify-center p-7 sm:p-10">{subscribed ? <div className="text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check /></span><h2 className="mt-5 text-3xl font-black">You’re on the list.</h2><p className="mt-3 text-sm text-slate-500">Fresh event ideas and marketplace discoveries are headed your way.</p></div> : <><span className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-primary"><Sparkles className="h-4 w-4" /> Plan with inspiration</span><h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Make the next occasion feel considered.</h2><p className="mt-4 text-sm leading-6 text-slate-500">Receive useful planning notes, fresh vendor discoveries and thoughtfully selected event ideas. No noise.</p><form onSubmit={(event) => void subscribe(event)} className="mt-6"><label className="flex items-center gap-3 rounded-2xl border bg-slate-50 px-4 py-2 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10"><Mail className="h-5 w-5 text-primary" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" /></label><button disabled={sending} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-extrabold text-white disabled:opacity-60">{sending ? 'Joining…' : 'Join the Merry List'}<ArrowRight className="h-4 w-4" /></button></form><p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5" /> Unsubscribe anytime. Your details stay private.</p></>}</div></section></div>}
  </>;
}
