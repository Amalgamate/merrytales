import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Check, CheckCircle2, ChevronLeft, ChevronRight, Download, LockKeyhole, MapPin, Share2, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const guestPlanKey = 'merry_tales_guest_plan';

const serviceOptions = [
  { id: 'venue', label: 'Venue', hint: 'Spaces that fit your guest count' },
  { id: 'catering', label: 'Catering', hint: 'Food, drinks and service' },
  { id: 'decor', label: 'Décor & flowers', hint: 'Styling, florals and furniture' },
  { id: 'photo', label: 'Photography & film', hint: 'Capture the day beautifully' },
  { id: 'attire', label: 'Attire & beauty', hint: 'Outfits, makeup and grooming' },
  { id: 'music', label: 'Music & entertainment', hint: 'DJ, MC and live acts' },
  { id: 'cake', label: 'Cake & treats', hint: 'Cake, desserts and favours' },
  { id: 'transport', label: 'Transport', hint: 'Couple and guest movement' },
];

const celebrationTypes = ['Wedding', 'Nikah', 'Walima', 'Traditional ceremony', 'Engagement', 'Civil ceremony', 'Multicultural celebration', 'Other'];
const traditionOptions = ['Somali', 'Sudanese', 'Islamic', 'Christian', 'Swahili', 'Kikuyu', 'Luo', 'Kamba', 'Hindu', 'Diaspora family', 'Multicultural'];
const preferenceOptions = ['Halal catering', 'Alcohol-free event', 'Prayer space or timings', 'Women-led photo/video team', 'Separate seating', 'Modest attire considerations', 'Family or elders involved', 'Multilingual MC or programme'];

type GuestPlan = {
  partnerOne: string; partnerTwo: string; eventDate: string; city: string; guestTarget: string; budget: string; needs: string[]; celebrationType: string; traditions: string[]; planningPreferences: string[];
};

const emptyPlan: GuestPlan = { partnerOne: '', partnerTwo: '', eventDate: '', city: '', guestTarget: '150', budget: '800000', needs: [], celebrationType: 'Wedding', traditions: [], planningPreferences: [] };

function pdfSafe(value: string) {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replace(/[\\()]/g, '\\$&');
}

function planPdf(plan: GuestPlan, recommendations: string[]) {
  const title = `${plan.partnerOne || 'Your'} & ${plan.partnerTwo || 'Celebration'} plan`;
  const lines = [
    'MERRY TALES - PERSONAL PLANNING PREVIEW', '', title, `Date: ${plan.eventDate || 'To be confirmed'}`,
    `Location: ${plan.city || 'To be confirmed'}`, `Guests: ${plan.guestTarget || 'To be confirmed'}`,
    `Estimated budget: KES ${Number(plan.budget || 0).toLocaleString()}`, '', 'YOUR NEXT STEPS',
    ...recommendations.map((item, index) => `${index + 1}. ${item}`), '',
    'This is a preview. Create a free Merry Tales account to save your full checklist,',
    'compare vendors, manage your spending and collaborate with your partner.'
  ].map(pdfSafe);
  const stream = ['BT', '/F1 18 Tf', '54 790 Td', ...lines.flatMap((line, index) => index === 0 ? [`(${line}) Tj`] : ['0 -24 Td', index === 1 ? '/F1 12 Tf' : '', `(${line}) Tj`].filter(Boolean)), 'ET'].join('\n');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function Create() {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<GuestPlan>(() => {
    try { return { ...emptyPlan, ...JSON.parse(localStorage.getItem(guestPlanKey) || '{}') }; } catch { return emptyPlan; }
  });
  const [notice, setNotice] = useState('');
  const recommendations = useMemo(() => {
    const selected = serviceOptions.filter(item => plan.needs.includes(item.id)).map(item => item.label);
    const city = plan.city || 'your area';
    const people = Number(plan.guestTarget || 0);
    return [
      ...(plan.traditions.length ? [`Include ${plan.traditions.join(', ')} considerations in your ${plan.celebrationType.toLowerCase()} plan.`] : []),
      ...(plan.planningPreferences.length ? [`Prioritise vendors who support ${plan.planningPreferences.slice(0, 2).join(' and ').toLowerCase()}.`] : []),
      ...selected.slice(0, 4).map(item => `Explore verified ${item.toLowerCase()} options in ${city}.`),
      `Set aside a contingency fund for a celebration of ${people || 'your'} guests.`,
      'Build your vendor shortlist before requesting quotes.'
    ];
  }, [plan.celebrationType, plan.city, plan.guestTarget, plan.needs, plan.planningPreferences, plan.traditions]);

  useEffect(() => { localStorage.setItem(guestPlanKey, JSON.stringify(plan)); }, [plan]);
  const update = (field: keyof GuestPlan, value: string) => setPlan(current => ({ ...current, [field]: value }));
  const toggleNeed = (id: string) => setPlan(current => ({ ...current, needs: current.needs.includes(id) ? current.needs.filter(item => item !== id) : [...current.needs, id] }));
  const toggleChoice = (field: 'traditions' | 'planningPreferences', value: string) => setPlan(current => ({ ...current, [field]: current[field].includes(value) ? current[field].filter(item => item !== value) : [...current[field], value] }));
  const canContinue = step === 1 ? Boolean(plan.eventDate && plan.city && plan.guestTarget && plan.budget) : step === 2 ? plan.needs.length > 0 : true;
  const download = () => {
    const blob = planPdf(plan, recommendations); const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = 'merry-tales-plan-preview.pdf'; link.click(); URL.revokeObjectURL(url); setNotice('Your plan preview PDF is downloading.');
  };
  const share = async () => {
    const file = new File([planPdf(plan, recommendations)], 'merry-tales-plan-preview.pdf', { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ title: 'My Merry Tales plan', text: 'Here is my event planning preview.', files: [file] }); setNotice('Your plan preview was shared.'); } catch { setNotice('Sharing was cancelled. Your plan is still saved in this browser.'); } return; }
    download(); setNotice('Your browser does not support direct sharing, so the PDF is downloading instead.');
  };

  return <div className="min-h-screen bg-[#faf9fc] pt-24 pb-20">
    <div className="mx-auto w-full max-w-4xl px-4">
      <div className="mb-8 flex items-center justify-between gap-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">
        {['Your celebration', 'What you need', 'Your plan preview'].map((label, index) => <div key={label} className="flex flex-1 items-center gap-2"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${step > index + 1 ? 'border-primary bg-primary text-white' : step === index + 1 ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white text-slate-400'}`}>{step > index + 1 ? <Check className="h-4 w-4" /> : index + 1}</span><span className="hidden sm:inline">{label}</span>{index < 2 && <span className="h-px flex-1 bg-slate-200" />}</div>)}
      </div>
      <section className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_16px_50px_rgba(31,25,54,.08)]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-pink-50 to-violet-50 px-6 py-7 text-center md:px-12">
          <p className="mb-2 flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-primary"><Sparkles className="h-4 w-4" /> Free planning playground</p>
          <h1 className="text-3xl font-extrabold text-[#171735] md:text-4xl">{step === 1 ? "Let's start your story." : step === 2 ? 'Choose what you want help with.' : 'Your personalised plan is ready.'}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">{step === 1 ? 'No account needed. Build a tailored plan before deciding whether to save it.' : step === 2 ? 'Select every service you want to organise. We will shape your recommendations around them.' : 'Review your next steps and share a PDF. Create an account only when you are ready to save and manage everything.'}</p>
        </div>
        <div className="p-6 md:p-10">
          {step === 1 && <div className="mx-auto max-w-2xl space-y-5">
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Partner 1 <span className="font-normal text-slate-400">(optional)</span><Input value={plan.partnerOne} onChange={event => update('partnerOne', event.target.value)} placeholder="John" className="mt-2 h-12 rounded-xl" /></label><label className="text-sm font-bold">Partner 2 <span className="font-normal text-slate-400">(optional)</span><Input value={plan.partnerTwo} onChange={event => update('partnerTwo', event.target.value)} placeholder="Mary" className="mt-2 h-12 rounded-xl" /></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold"><Calendar className="mr-1 inline h-4 w-4 text-primary" />Event date<Input value={plan.eventDate} onChange={event => update('eventDate', event.target.value)} type="date" className="mt-2 h-12 rounded-xl" /></label><label className="text-sm font-bold"><MapPin className="mr-1 inline h-4 w-4 text-primary" />Location<Input value={plan.city} onChange={event => update('city', event.target.value)} placeholder="Nairobi, Kenya" className="mt-2 h-12 rounded-xl" /></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold"><Users className="mr-1 inline h-4 w-4 text-primary" />Expected guests<Input min="1" value={plan.guestTarget} onChange={event => update('guestTarget', event.target.value)} type="number" className="mt-2 h-12 rounded-xl" /></label><label className="text-sm font-bold">Approximate budget (KES)<Input min="0" value={plan.budget} onChange={event => update('budget', event.target.value)} type="number" className="mt-2 h-12 rounded-xl" /></label></div>
          </div>}
          {step === 2 && <div className="space-y-8"><section><h2 className="text-lg font-extrabold text-[#171735]">Make this celebration feel like yours</h2><p className="mt-1 text-sm text-slate-500">Optional. Choose any traditions or practical preferences that matter to you. You can combine them or skip this entirely.</p><label className="mt-5 block text-sm font-bold">Celebration type<select value={plan.celebrationType} onChange={event => update('celebrationType', event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><>{celebrationTypes.map(type => <option key={type}>{type}</option>)}</></select></label><p className="mt-5 text-sm font-bold">Traditions you would like represented <span className="font-normal text-slate-400">(optional)</span></p><div className="mt-3 flex flex-wrap gap-2">{traditionOptions.map(item => <button type="button" key={item} onClick={() => toggleChoice('traditions', item)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${plan.traditions.includes(item) ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'}`}>{plan.traditions.includes(item) && <Check className="mr-1 inline h-3.5 w-3.5" />}{item}</button>)}</div><p className="mt-5 text-sm font-bold">Practical planning needs <span className="font-normal text-slate-400">(optional)</span></p><div className="mt-3 flex flex-wrap gap-2">{preferenceOptions.map(item => <button type="button" key={item} onClick={() => toggleChoice('planningPreferences', item)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${plan.planningPreferences.includes(item) ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'}`}>{plan.planningPreferences.includes(item) && <Check className="mr-1 inline h-3.5 w-3.5" />}{item}</button>)}</div></section><section className="border-t border-slate-100 pt-7"><h2 className="text-lg font-extrabold text-[#171735]">What would you like help with?</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{serviceOptions.map(item => <button type="button" key={item.id} onClick={() => toggleNeed(item.id)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${plan.needs.includes(item.id) ? 'border-primary bg-pink-50 ring-1 ring-primary' : 'border-slate-200 hover:border-primary/40'}`}><span className={`mt-0.5 grid h-5 w-5 place-items-center rounded border ${plan.needs.includes(item.id) ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white'}`}>{plan.needs.includes(item.id) && <Check className="h-3.5 w-3.5" />}</span><span><strong className="block text-sm text-[#171735]">{item.label}</strong><span className="mt-1 block text-xs text-slate-500">{item.hint}</span></span></button>)}</div></section></div>}
          {step === 3 && <div className="mx-auto max-w-3xl space-y-6">
            <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-pink-50 p-4"><p className="text-xs font-bold uppercase text-primary">Readiness</p><p className="mt-1 text-2xl font-extrabold text-[#171735]">{Math.min(88, 28 + plan.needs.length * 7)}%</p><p className="mt-1 text-xs text-slate-500">A strong start</p></div><div className="rounded-2xl bg-violet-50 p-4"><p className="text-xs font-bold uppercase text-violet-600">Budget guide</p><p className="mt-1 text-2xl font-extrabold text-[#171735]">KES {Number(plan.budget || 0).toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">Your starting range</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs font-bold uppercase text-amber-700">Services chosen</p><p className="mt-1 text-2xl font-extrabold text-[#171735]">{plan.needs.length}</p><p className="mt-1 text-xs text-slate-500">Ready for matching</p></div></div>
            <div className="rounded-2xl border border-slate-200 p-5"><h2 className="font-extrabold text-[#171735]">Your recommended next steps</h2><div className="mt-4 space-y-3">{recommendations.slice(0, 4).map(item => <div key={item} className="flex gap-3 text-sm text-slate-600"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />{item}</div>)}</div></div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="pointer-events-none select-none blur-[3px] opacity-60"><h2 className="font-extrabold text-[#171735]">Your complete checklist & vendor matches</h2><div className="mt-4 space-y-3">{['Compare your tailored vendor matches', 'Track planned versus actual spending', 'Set deadlines and get reminders'].map(item => <div key={item} className="rounded-xl bg-white p-3 text-sm">{item}</div>)}</div></div><div className="absolute inset-0 grid place-items-center bg-white/35"><div className="rounded-2xl bg-white px-5 py-4 text-center shadow-lg"><LockKeyhole className="mx-auto h-5 w-5 text-primary" /><p className="mt-2 text-sm font-extrabold text-[#171735]">Full plan unlocks when you save</p></div></div></div>
            <div className="flex flex-wrap justify-center gap-3"><Button variant="outline" onClick={download} className="rounded-full"><Download />Download PDF</Button><Button variant="outline" onClick={() => void share()} className="rounded-full"><Share2 />Share</Button></div>
            <div className="rounded-3xl bg-[#171735] p-6 text-center text-white md:p-8"><h2 className="text-2xl font-extrabold">Keep this plan and make it happen.</h2><p className="mx-auto mt-2 max-w-xl text-sm text-white/75">Create a free account to unlock your complete checklist, budget tracker, vendor shortlists and shared planning workspace.</p><div className="mt-5 flex flex-wrap justify-center gap-3"><Link to="/register"><Button className="rounded-full px-6 font-bold">Save & unlock my plan <ChevronRight /></Button></Link><Link to="/login" className="inline-flex items-center rounded-full border border-white/30 px-5 text-sm font-bold hover:bg-white/10">I already have an account</Link></div></div>
          </div>}
          {notice && <p role="status" className="mt-5 text-center text-sm font-semibold text-primary">{notice}</p>}
          {step < 3 && <div className="mx-auto mt-9 flex max-w-2xl items-center justify-between border-t border-slate-100 pt-6"><Button variant="ghost" onClick={() => setStep(current => current - 1)} disabled={step === 1}><ChevronLeft />Back</Button><Button disabled={!canContinue} onClick={() => setStep(current => current + 1)} className="rounded-full px-6 font-bold">Continue <ChevronRight /></Button></div>}
          {step === 3 && <div className="mx-auto mt-8 flex max-w-3xl"><Button variant="ghost" onClick={() => setStep(2)}><ChevronLeft />Edit my choices</Button></div>}
        </div>
      </section>
    </div>
  </div>;
}
