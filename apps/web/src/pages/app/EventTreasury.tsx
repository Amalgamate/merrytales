import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, Check, CircleDollarSign, FileCheck2, Landmark, Loader2, Plus, ReceiptText, ShieldCheck, WalletCards, X } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type EventRecord = { id: string; title: string; currency: string; budget: string | number | null };
type Commitment = { id: string; description: string; amount: string; status: string };
type Envelope = { id: string; name: string; allocatedAmount: string; currency: string; color?: string; commitments: Commitment[] };
type Quote = { id: string; quoteNumber: string; title: string; status: string; total: string; currency: string; vendor?: { businessName: string }; commitment?: Commitment };
type Approval = { id: string; purpose: string; amount: string; currency: string; status: string; requestedBy: { firstName: string; lastName: string } };
type TreasurySummary = {
  event: EventRecord;
  totals: { budget: number; funded: number; reserved: number; paid: number; available: number };
  envelopes: Envelope[];
  quotes: Quote[];
  approvals: Approval[];
};

const palette = ['#E83E83', '#7C3AED', '#0284C7', '#059669', '#D97706', '#DC2626'];
const formatMoney = (amount: number | string, currency = 'KES') => new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount));

export function EventTreasury() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [showQuote, setShowQuote] = useState(false);

  const loadSummary = useCallback(async (eventId: string) => {
    setLoading(true); setError('');
    try { setSummary(await apiRequest<TreasurySummary>(`/finance/events/${eventId}/summary`)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load Event Treasury.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    apiRequest<EventRecord[]>('/events').then((items) => {
      setEvents(items);
      if (items[0]) { setSelectedEventId(items[0].id); return loadSummary(items[0].id); }
      setLoading(false);
    }).catch((err) => { setError(err instanceof Error ? err.message : 'Unable to load events.'); setLoading(false); });
  }, [loadSummary]);

  const allocated = useMemo(() => summary?.envelopes.reduce((sum, item) => sum + Number(item.allocatedAmount), 0) ?? 0, [summary]);
  const committed = (envelope: Envelope) => envelope.commitments.filter((item) => item.status === 'RESERVED' || item.status === 'PAID').reduce((sum, item) => sum + Number(item.amount), 0);

  async function addEnvelope(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedEventId) return;
    const data = new FormData(event.currentTarget); setWorking(true); setError('');
    try {
      await apiRequest(`/finance/events/${selectedEventId}/envelopes`, { method: 'POST', body: JSON.stringify({ name: data.get('name'), allocatedAmount: Number(data.get('amount')), color: palette[(summary?.envelopes.length ?? 0) % palette.length] }) });
      setShowEnvelope(false); setNotice('Budget envelope added.'); await loadSummary(selectedEventId);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to add envelope.'); }
    finally { setWorking(false); }
  }

  async function addQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedEventId) return;
    const data = new FormData(event.currentTarget); setWorking(true); setError('');
    try {
      await apiRequest('/finance/quotes', { method: 'POST', body: JSON.stringify({ eventId: selectedEventId, title: data.get('title'), depositAmount: Number(data.get('deposit') || 0) || undefined, lines: [{ description: data.get('description'), quantity: Number(data.get('quantity')), unitPrice: Number(data.get('unitPrice')), taxRate: Number(data.get('taxRate')) }] }) });
      setShowQuote(false); setNotice('Draft quote created.'); await loadSummary(selectedEventId);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create quote.'); }
    finally { setWorking(false); }
  }

  async function acceptQuote(quoteId: string) {
    setWorking(true); setError('');
    try {
      await apiRequest(`/finance/quotes/${quoteId}/accept`, { method: 'POST', body: JSON.stringify({ envelopeId: summary?.envelopes[0]?.id, requireApproval: false }) });
      setNotice('Quote accepted and its amount is now reserved.'); await loadSummary(selectedEventId);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to accept quote.'); }
    finally { setWorking(false); }
  }

  async function decideApproval(id: string, status: 'APPROVED' | 'REJECTED') {
    setWorking(true); setError('');
    try { await apiRequest(`/finance/approvals/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); setNotice(`Request ${status.toLowerCase()}.`); await loadSummary(selectedEventId); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to decide request.'); }
    finally { setWorking(false); }
  }

  if (loading && !summary) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!events.length) return <div className="bg-white rounded-3xl border p-10 text-center"><Landmark className="h-10 w-10 text-primary mx-auto mb-4" /><h1 className="text-2xl font-bold">Create an event first</h1><p className="text-gray-500 mt-2">Your Event Treasury will be created around its budget and currency.</p></div>;

  const currency = summary?.event.currency ?? 'KES';
  const budget = summary?.totals.budget ?? 0;
  return (
    <div className="space-y-7 animate-in fade-in duration-500 pt-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><div className="flex items-center gap-2 text-primary font-bold text-sm mb-2"><ShieldCheck className="h-4 w-4" /> Every coin accounted for</div><h1 className="text-3xl md:text-4xl font-extrabold">Event Treasury</h1><p className="text-gray-500 mt-2">Budget, approve and track event spending from one source of truth.</p></div>
        <select value={selectedEventId} onChange={(e) => { setSelectedEventId(e.target.value); loadSummary(e.target.value); }} className="h-11 rounded-xl border bg-white px-4 text-sm font-semibold">
          {events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </div>

      {(error || notice) && <div className={`rounded-2xl px-5 py-3 text-sm font-medium ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{error || notice}</div>}

      <div className="bg-foreground text-white rounded-[30px] p-7 md:p-9 relative overflow-hidden">
        <div className="absolute -right-20 -top-24 w-64 h-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative grid md:grid-cols-[1.3fr_1fr] gap-7 items-end">
          <div><p className="text-white/60 text-xs font-bold uppercase tracking-[0.16em]">Provider-confirmed event funds</p><p className="text-4xl md:text-5xl font-extrabold mt-2">{formatMoney(summary?.totals.funded ?? 0, currency)}</p><p className="text-white/60 text-sm mt-3">Available after commitments: <strong className="text-white">{formatMoney(summary?.totals.available ?? 0, currency)}</strong></p></div>
          <div className="flex flex-wrap md:justify-end gap-3"><Button disabled className="rounded-full bg-white text-foreground hover:bg-white/90"><ArrowDownToLine className="h-4 w-4 mr-2" /> Load money</Button><span className="w-full md:w-auto text-xs text-white/50 self-center">Payment-partner connection required</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Event budget', value: budget, Icon: CircleDollarSign, tone: 'text-primary bg-primary/10' },
          { label: 'Allocated', value: allocated, Icon: WalletCards, tone: 'text-purple-600 bg-purple-100' },
          { label: 'Reserved', value: summary?.totals.reserved ?? 0, Icon: FileCheck2, tone: 'text-amber-600 bg-amber-100' },
          { label: 'Paid', value: summary?.totals.paid ?? 0, Icon: ReceiptText, tone: 'text-green-600 bg-green-100' },
        ].map(({ label, value, Icon, tone }) => <div key={label} className="bg-white rounded-2xl border border-border-soft p-5"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}><Icon className="h-5 w-5" /></div><p className="text-xs text-gray-500 font-semibold mt-4">{label}</p><p className="font-extrabold text-lg mt-1">{formatMoney(value, currency)}</p></div>)}
      </div>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-7">
        <section className="bg-white rounded-3xl border border-border-soft p-6 md:p-7">
          <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold">Budget envelopes</h2><p className="text-sm text-gray-500">Ring-fence the plan without moving money.</p></div><Button variant="outline" onClick={() => setShowEnvelope(!showEnvelope)} className="rounded-full"><Plus className="h-4 w-4 mr-2" /> Envelope</Button></div>
          {showEnvelope && <form onSubmit={addEnvelope} className="grid sm:grid-cols-[1fr_160px_auto] gap-3 bg-gray-50 rounded-2xl p-4 mb-5"><Input name="name" placeholder="e.g. Photography" required minLength={2} /><Input name="amount" type="number" min="0" step="0.01" placeholder="Amount" required /><Button disabled={working} className="rounded-xl">Save</Button></form>}
          <div className="space-y-5">
            {summary?.envelopes.length ? summary.envelopes.map((item) => {
              const used = committed(item); const pct = Number(item.allocatedAmount) ? Math.min(100, used / Number(item.allocatedAmount) * 100) : 0;
              return <div key={item.id}><div className="flex justify-between gap-4 mb-2"><div><p className="font-bold">{item.name}</p><p className="text-xs text-gray-500">{formatMoney(used, item.currency)} committed</p></div><p className="font-bold text-sm">{formatMoney(item.allocatedAmount, item.currency)}</p></div><div className="h-2.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color || '#E83E83' }} /></div></div>;
            }) : <div className="text-center py-10 text-gray-500"><WalletCards className="h-9 w-9 mx-auto mb-3 text-gray-300" /><p className="font-semibold text-foreground">No envelopes yet</p><p className="text-sm">Start by allocating venue, catering or photography.</p></div>}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-border-soft p-6 md:p-7">
          <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold">Approvals</h2><p className="text-sm text-gray-500">Decisions with a permanent trail.</p></div></div>
          <div className="space-y-3">
            {summary?.approvals.length ? summary.approvals.slice(0, 5).map((item) => <div key={item.id} className="border rounded-2xl p-4"><div className="flex justify-between gap-3"><p className="font-semibold text-sm">{item.purpose}</p><span className={`text-[10px] font-bold px-2 py-1 h-fit rounded-full ${item.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : item.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span></div><p className="font-extrabold mt-2">{formatMoney(item.amount, item.currency)}</p>{item.status === 'PENDING' && <div className="flex gap-2 mt-3"><Button size="sm" onClick={() => decideApproval(item.id, 'APPROVED')} disabled={working} className="rounded-full"><Check className="h-3.5 w-3.5 mr-1" /> Approve</Button><Button size="sm" variant="outline" onClick={() => decideApproval(item.id, 'REJECTED')} disabled={working} className="rounded-full"><X className="h-3.5 w-3.5 mr-1" /> Reject</Button></div>}</div>) : <div className="text-center py-10 text-gray-500"><ShieldCheck className="h-9 w-9 mx-auto mb-3 text-gray-300" /><p className="font-semibold text-foreground">Nothing awaiting approval</p><p className="text-sm">High-value requests will appear here.</p></div>}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-3xl border border-border-soft p-6 md:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"><div><h2 className="text-xl font-bold">Quotes & commitments</h2><p className="text-sm text-gray-500">Accepting a quote reserves its value in the event budget.</p></div><Button onClick={() => setShowQuote(!showQuote)} className="rounded-full"><Plus className="h-4 w-4 mr-2" /> New quote</Button></div>
        {showQuote && <form onSubmit={addQuote} className="grid md:grid-cols-2 gap-3 bg-gray-50 rounded-2xl p-4 mb-5"><Input name="title" placeholder="Quote title" required minLength={3} /><Input name="description" placeholder="Line item description" required minLength={2} /><Input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required /><Input name="unitPrice" type="number" min="0" step="0.01" placeholder="Unit price" required /><Input name="taxRate" type="number" min="0" max="100" step="0.01" defaultValue="0" placeholder="Tax %" /><Input name="deposit" type="number" min="0" step="0.01" placeholder="Optional deposit" /><div className="md:col-span-2 flex justify-end"><Button disabled={working} className="rounded-full">Create draft</Button></div></form>}
        <div className="divide-y">
          {summary?.quotes.length ? summary.quotes.map((quote) => <div key={quote.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="flex gap-2 items-center"><p className="font-bold">{quote.title}</p><span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-full">{quote.status}</span></div><p className="text-xs text-gray-500 mt-1">{quote.quoteNumber}{quote.vendor ? ` · ${quote.vendor.businessName}` : ''}</p></div><div className="flex items-center gap-3 sm:text-right"><p className="font-extrabold">{formatMoney(quote.total, quote.currency)}</p>{(quote.status === 'DRAFT' || quote.status === 'SENT') && <Button size="sm" variant="outline" disabled={working} onClick={() => acceptQuote(quote.id)} className="rounded-full">Accept & reserve</Button>}</div></div>) : <div className="text-center py-10 text-gray-500"><ReceiptText className="h-9 w-9 mx-auto mb-3 text-gray-300" /><p className="font-semibold text-foreground">No quotes yet</p><p className="text-sm">Create a vendor quote and connect it to the budget.</p></div>}
        </div>
      </section>
    </div>
  );
}
