import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays as Sparkles, Loader2, Send, X } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type Message = { role: 'user' | 'assistant'; content: string };
const starters = ['Help me plan an event', 'Build a simple budget', 'Find the right vendors'];

export function AIChat() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<'ai' | 'guided' | null>(null);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Hi, I’m Merry. Tell me what you are planning and I’ll help you find a practical next step.' }]);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);
  useEffect(() => {
    const openAssistant = () => setOpen(true);
    window.addEventListener('merry-tales:open-assistant', openAssistant);
    return () => window.removeEventListener('merry-tales:open-assistant', openAssistant);
  }, []);

  const send = async (event?: FormEvent, suggestion?: string) => {
    event?.preventDefault();
    const content = (suggestion ?? draft).trim();
    if (!content || sending) return;
    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next); setDraft(''); setSending(true);
    try {
      const result = await apiRequest<{ reply: string; mode: 'ai' | 'guided' }>('/assistant/chat', { method: 'POST', body: JSON.stringify({ messages: next.slice(-10) }) });
      setMode(result.mode);
      setMessages((current) => [...current, { role: 'assistant', content: result.reply }]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', content: 'I’m having trouble connecting right now. You can still search Merry Tales by service, location and date, or try again shortly.' }]);
    } finally { setSending(false); }
  };

  return <div className="fixed bottom-20 right-4 z-[80] sm:bottom-6 sm:right-6">
    {open && <section className="mb-3 flex h-[min(620px,calc(100vh-120px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white text-[#171735] shadow-[0_24px_70px_rgba(16,23,42,.25)]">
      <header className="flex items-center gap-3 bg-[#171735] px-5 py-4 text-white"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary"><Sparkles className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 className="font-extrabold">Ask Merry</h2><p className="text-[11px] text-white/60">Your event planning assistant</p></div><button onClick={() => setOpen(false)} aria-label="Close assistant" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><X className="h-5 w-5" /></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8f8fb] p-4">{messages.map((message, index) => <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border bg-white text-slate-700 shadow-sm'}`}>{message.content}</div></div>)}{messages.length === 1 && <div className="flex flex-wrap gap-2">{starters.map((item) => <button key={item} onClick={() => void send(undefined, item)} className="rounded-full border bg-white px-3 py-2 text-xs font-bold text-primary hover:bg-pink-50">{item}</button>)}</div>}{sending && <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Merry is thinking…</div>}<div ref={endRef} /></div>
      <form onSubmit={(event) => void send(event)} className="border-t bg-white p-3"><div className="flex items-end gap-2 rounded-2xl border bg-slate-50 p-2 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} rows={1} maxLength={2000} placeholder="Ask about planning, budgets or vendors…" className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400" /><button disabled={!draft.trim() || sending} aria-label="Send message" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white disabled:opacity-40"><Send className="h-4 w-4" /></button></div>{mode && <p className="mt-2 text-center text-[10px] text-slate-400">{mode === 'ai' ? 'AI-generated guidance—verify important details.' : 'Guided mode—connect an AI key for generative replies.'}</p>}</form>
    </section>}
  </div>;
}
