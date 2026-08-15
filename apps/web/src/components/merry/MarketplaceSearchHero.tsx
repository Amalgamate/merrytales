import { useEffect, useRef, useState } from 'react';
import type { FormEvent, WheelEvent } from 'react';
import { CalendarDays, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const popular = ['Weddings', 'Catering', 'Photography', 'Decor', 'Venues', 'Invitations'];
const suggestions = ['Wedding decor', 'Wedding venues', 'Event photographer', 'Catering', 'Birthday cakes', 'Invitations', 'Luxury car hire', 'Event MC'];

const heroSlides = [
  {
    eyebrow: 'Your whole event, one calm place',
    title: 'Plan it your way.',
    accent: 'Bring it beautifully to life.',
    copy: 'Build a budget, discover trusted vendors and keep every decision, payment and detail together.',
    image: '/campaign/plan-together.png',
    alt: 'A Kenyan couple and event planner coordinating an elegant outdoor celebration',
    label: 'PLAN',
    cta: 'Start planning',
    href: '/plan',
    chips: ['Budget', 'Guest list', 'Trusted vendors'],
  },
  {
    eyebrow: 'Gift Pesa & unforgettable experiences',
    title: 'Give more than a gift.',
    accent: 'Give them a story.',
    copy: 'Send Gift Pesa, contribute as a group, or choose flights, adventures and thoughtful experiences for someone you love.',
    image: '/campaign/gift-experiences.png',
    alt: 'A joyful Kenyan family sharing a premium celebration gift',
    label: 'GIFT',
    cta: 'Explore gifting',
    href: '/gifts',
    chips: ['Gift Pesa', 'Flights', 'Adventures', 'Hotpoint + DStv voucher ideas'],
  },
  {
    eyebrow: 'From the diaspora, with love',
    title: 'Be there, even from afar.',
    accent: 'Every coin accounted for.',
    copy: 'Plan Cucu’s celebration, fund a loved one’s event and follow the budget from your own currency to the final moment.',
    image: '/hero/Be There.png',
    alt: 'A Kenyan grandmother celebrating with family while relatives join from abroad',
    label: 'DIASPORA',
    cta: 'Plan for family',
    href: '/plan',
    chips: ['Multi-currency ready', 'M-PESA', 'Visa'],
  },
  {
    eyebrow: 'Built for vendors & corporate teams',
    title: 'Run remarkable events.',
    accent: 'Grow serious business.',
    copy: 'Onboard services, respond to briefs and manage corporate events, client gifting, quotes and delivery from one workspace.',
    image: '/campaign/corporate-vendors.png',
    alt: 'A Kenyan event production team coordinating a premium corporate gala',
    label: 'BUSINESS',
    cta: 'Join as a vendor',
    href: '/vendor/join',
    chips: ['Quotes', 'Corporate gifting', 'Delivery'],
  },
];

function TypewriterHeading({ text }: { text: string }) {
  const characters = Array.from(text);
  const [visibleCharacters, setVisibleCharacters] = useState(characters.length);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleCharacters(characters.length);
      return;
    }

    setVisibleCharacters(0);
    let index = 0;
    const startTimer = window.setTimeout(() => {
      const typingTimer = window.setInterval(() => {
        index += 1;
        setVisibleCharacters(index);
        if (index >= characters.length) window.clearInterval(typingTimer);
      }, 42);
      typingTimerRef = typingTimer;
    }, 140);
    let typingTimerRef: number | undefined;

    return () => {
      window.clearTimeout(startTimer);
      if (typingTimerRef) window.clearInterval(typingTimerRef);
    };
  }, [text]);

  const complete = visibleCharacters >= characters.length;

  return (
    <h1 aria-label={text} className="relative mx-auto max-w-4xl font-display font-bold leading-[1.02] tracking-[-.035em] text-[#10172a]" style={{ fontSize: 'clamp(2.35rem, 12vw, 5.4rem)' }}>
      <span aria-hidden="true" className="invisible block">{text}</span>
      <span aria-hidden="true" className="absolute inset-0 block">{characters.slice(0, visibleCharacters).join('')}{!complete && <span className="hero-type-cursor" />}</span>
    </h1>
  );
}

export function MarketplaceSearchHero() {
  const navigate = useNavigate();
  const wheelLockRef = useRef(false);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = heroSlides[activeSlide];

  useEffect(() => {
    let idleTimer: number;
    const scheduleAdvance = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        setActiveSlide((current) => (current + 1) % heroSlides.length);
      }, 5000);
    };

    const detectScroll = () => scheduleAdvance();
    window.addEventListener('wheel', detectScroll, { passive: true, capture: true });
    window.addEventListener('scroll', detectScroll, { passive: true });
    scheduleAdvance();

    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener('wheel', detectScroll, { capture: true });
      window.removeEventListener('scroll', detectScroll);
    };
  }, [activeSlide]);

  const filtered = query.trim() ? suggestions.filter((item) => item.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : suggestions.slice(0, 5);

  const search = (event?: FormEvent, suggestedQuery?: string) => {
    event?.preventDefault();
    const params = new URLSearchParams();
    const finalQuery = suggestedQuery ?? query;
    if (finalQuery.trim()) params.set('q', finalQuery.trim());
    if (city.trim()) params.set('city', city.trim());
    if (date) params.set('date', date);
    navigate(`/shop${params.size ? `?${params.toString()}` : ''}`);
  };

  const shuffleOnWheel = (event: WheelEvent<HTMLElement>) => {
    if (Math.abs(event.deltaY) < 4) return;
    const movingForward = event.deltaY > 0;
    const canChangeSlide = movingForward ? activeSlide < heroSlides.length - 1 : activeSlide > 0;

    // Keep the page anchored while there is another story in the scroll direction.
    // At the final/first boundary, allow the browser to continue normal page scrolling.
    if (!canChangeSlide) return;
    event.preventDefault();
    event.stopPropagation();
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    setActiveSlide((current) => current + (movingForward ? 1 : -1));
    window.setTimeout(() => { wheelLockRef.current = false; }, 480);
  };

  return (
    <section onWheel={shuffleOnWheel} className="relative isolate z-20 min-h-[620px] overflow-hidden bg-white text-[#10172a] sm:min-h-[680px] lg:min-h-[calc(100svh-80px)]">
      <div className="pointer-events-none absolute inset-0 z-0 bg-white">
        {heroSlides.map((item, index) => (
          <img
            key={item.image}
            src={item.image}
            alt={activeSlide === index ? item.alt : ''}
            aria-hidden={activeSlide !== index}
            className={`hero-fade-image absolute inset-0 h-full w-full object-cover ${activeSlide === index ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,.06) 0%, rgba(255,255,255,.12) 34%, rgba(255,255,255,.30) 58%, rgba(255,255,255,.72) 80%, #ffffff 100%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(90deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,.03) 30%, rgba(255,255,255,.06) 70%, rgba(255,255,255,.12) 100%)' }}
      />
      <div className="relative z-[2] mx-auto flex min-h-[620px] max-w-7xl flex-col justify-center px-4 pb-10 pt-8 sm:min-h-[680px] sm:px-6 lg:min-h-[calc(100svh-80px)] lg:px-8">
        <div className="hero-content mx-auto w-full max-w-5xl text-center">
            <div key={slide.title} className="animate-in fade-in duration-700">
              <TypewriterHeading text={slide.title} />
              <p className="mx-auto mt-3 max-w-2xl leading-[1.55] text-slate-600 sm:mt-4" style={{ fontSize: 'clamp(.92rem, 1vw, 1.15rem)' }}>{slide.copy}</p>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 sm:mt-4" role="tablist" aria-label="Merry Tales experiences">
              {heroSlides.map((item, index) => <button key={item.label} type="button" role="tab" aria-selected={activeSlide === index} aria-label={`Show ${item.label.toLowerCase()} story`} onClick={() => setActiveSlide(index)} className={`h-2 rounded-full transition-all ${activeSlide === index ? 'w-10 bg-primary' : 'w-2 bg-slate-300 hover:bg-slate-500'}`} />)}
            </div>
        </div>

        <form onSubmit={search} className="hero-search relative z-30 mx-auto mt-5 w-full max-w-6xl rounded-[1.15rem] border border-slate-200 bg-white p-1.5 text-[#10172a] shadow-[0_10px_28px_rgba(16,23,42,.12)] sm:mt-6 sm:rounded-[1.35rem] sm:p-2">
          <div className="grid lg:grid-cols-[1.55fr_.9fr_.85fr_auto]">
            <label className="hero-field relative flex items-center gap-3 rounded-xl px-3 py-3 text-[#10172a] focus-within:bg-pink-50/50 focus-within:ring-2 focus-within:ring-primary/25 sm:px-4 lg:border-r lg:border-slate-200"><Search className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block text-[9px] font-black uppercase tracking-[.08em] text-[#303348] sm:text-[10px]">What are you looking for?</span><input value={query} onFocus={() => setShowSuggestions(true)} onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)} onChange={(e) => setQuery(e.target.value)} className="mt-0.5 w-full bg-transparent text-sm font-medium text-[#10172a] outline-none placeholder:text-[#7b8497] placeholder:opacity-100" placeholder="Decor, photographer or venue" /></span>{showSuggestions && filtered.length > 0 && <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border bg-white py-2 text-[#10172a] shadow-xl">{filtered.map((item) => <button key={item} type="button" onMouseDown={() => { setQuery(item); setShowSuggestions(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-pink-50 hover:text-primary"><Search className="h-3.5 w-3.5" />{item}</button>)}</div>}</label>
            <label className="hero-field flex items-center gap-3 rounded-xl px-3 py-3 text-[#10172a] focus-within:bg-pink-50/50 focus-within:ring-2 focus-within:ring-primary/25 sm:px-4 lg:border-r lg:border-slate-200"><MapPin className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block text-[9px] font-black uppercase tracking-[.08em] text-[#303348] sm:text-[10px]">Where?</span><input value={city} onChange={(e) => setCity(e.target.value)} className="mt-0.5 w-full bg-transparent text-sm font-medium text-[#10172a] outline-none placeholder:text-[#7b8497] placeholder:opacity-100" placeholder="City or county" /></span></label>
            <label className="hero-field flex items-center gap-3 rounded-xl px-3 py-3 text-[#10172a] focus-within:bg-pink-50/50 focus-within:ring-2 focus-within:ring-primary/25 sm:px-4"><CalendarDays className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block text-[9px] font-black uppercase tracking-[.08em] text-[#303348] sm:text-[10px]">When?</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-0.5 w-full bg-transparent text-sm font-medium text-[#10172a] outline-none [color-scheme:light]" /></span></label>
            <button className="hero-search-button m-1 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-8 font-extrabold text-white shadow-[0_10px_25px_rgba(233,75,135,.3)] transition hover:-translate-y-0.5 hover:bg-[#d92f73] sm:min-h-12"><Search className="h-4 w-4" /> Search</button>
          </div>
        </form>

        <div className="hero-popular mx-auto mt-3 flex max-w-6xl items-center justify-start gap-2 overflow-x-auto pb-1 text-xs [scrollbar-width:none] sm:justify-center"><span className="shrink-0 font-extrabold text-slate-500">Popular:</span>{popular.map((item) => <button key={item} onClick={() => { setQuery(item); search(undefined, item); }} className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 font-semibold text-[#10172a] shadow-sm backdrop-blur-md transition hover:border-primary/30 hover:bg-pink-50 hover:text-primary sm:px-4 sm:py-2">{item}</button>)}</div>
      </div>
    </section>
  );
}
