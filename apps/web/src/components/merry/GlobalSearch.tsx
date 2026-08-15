import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Boxes, CalendarDays, Clock3, FileText, LayoutGrid as Sparkles, Search, Store, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stories } from '@/data/stories';
import { marketplaceCategories } from '@/data/marketplace';
import { fetchProducts, fetchVendors, toProductCard, toVendorCard } from '@/lib/marketplace';

type SearchKind = 'Product' | 'Vendor' | 'Category' | 'Story' | 'Destination';
type SearchRecord = { id: string; title: string; subtitle: string; kind: SearchKind; href: string; image?: string; keywords: string; priority?: number };

const destinations: SearchRecord[] = [
  { id: 'plan', title: 'Planning centre', subtitle: 'Checklist, guests, budget and vendor team', kind: 'Destination', href: '/plan', keywords: 'organize organise plan event checklist budget guests tools', priority: 5 },
  { id: 'gifts', title: 'Gifts & registries', subtitle: 'Send, contribute or build a registry', kind: 'Destination', href: '/gifts', keywords: 'gift voucher registry bride group gift cash', priority: 5 },
  { id: 'vendor-join', title: 'Sell on MerryTales', subtitle: 'Create a verified vendor storefront', kind: 'Destination', href: '/vendor/join', keywords: 'vendor join sell shop list business partner', priority: 4 },
  { id: 'create', title: 'Create an invitation', subtitle: 'Digital invites, event websites and printables', kind: 'Destination', href: '/create', keywords: 'design create invitation website whatsapp animated', priority: 4 },
];

const kindOrder: SearchKind[] = ['Product', 'Vendor', 'Category', 'Story', 'Destination'];
const kindIcons = { Product: Boxes, Vendor: Store, Category: Sparkles, Story: FileText, Destination: CalendarDays };

function normalise(value: string) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
function score(record: SearchRecord, rawQuery: string) {
  const query = normalise(rawQuery);
  if (!query) return record.priority ?? 0;
  const title = normalise(record.title);
  const haystack = `${title} ${normalise(record.subtitle)} ${normalise(record.keywords)}`;
  const tokens = query.split(' ');
  let value = record.priority ?? 0;
  if (title === query) value += 120;
  if (title.startsWith(query)) value += 75;
  if (title.includes(query)) value += 45;
  for (const token of tokens) {
    if (title.split(' ').some((word) => word.startsWith(token))) value += 22;
    else if (haystack.includes(token)) value += 10;
    else if (token.length > 3 && haystack.split(' ').some((word) => word.includes(token.slice(0, -1)))) value += 4;
    else return 0;
  }
  return value;
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [liveProducts, setLiveProducts] = useState<SearchRecord[]>([]);
  const [liveVendors, setLiveVendors] = useState<SearchRecord[]>([]);
  const [recent, setRecent] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('merry_tales_recent_searches') ?? '[]'); } catch { return []; } });

  useEffect(() => {
    if (!open) return;
    Promise.all([fetchProducts({ limit: 12 }), fetchVendors({ limit: 8 })]).then(([productResult, vendorResult]) => {
      setLiveProducts(productResult.items.map((item) => {
        const card = toProductCard(item);
        return { id: card.id, title: card.name, subtitle: `${card.subcategory} · From KES ${card.startingPrice.toLocaleString()}`, kind: 'Product' as const, href: `/shop/${card.slug}`, image: card.image, keywords: `${card.category} ${card.subcategory}`, priority: card.bestseller ? 6 : 2 };
      }));
      setLiveVendors(vendorResult.items.map((item) => {
        const card = toVendorCard(item);
        return { id: card.id, title: card.name, subtitle: `${card.category} · ${card.location} · ${card.rating}★`, kind: 'Vendor' as const, href: `/vendors/${card.slug}`, image: card.image, keywords: `${card.category} ${card.location} verified`, priority: 5 };
      }));
    }).catch(() => {
      setLiveProducts([]);
      setLiveVendors([]);
    });
  }, [open]);

  const records = useMemo<SearchRecord[]>(() => [
    ...liveProducts,
    ...liveVendors,
    ...marketplaceCategories.flatMap((category) => [{ id: category.slug, title: category.name, subtitle: category.description, kind: 'Category' as const, href: `/shop?category=${encodeURIComponent(category.name)}`, keywords: `${category.name} ${category.subcategories.join(' ')}`, priority: 3 }, ...category.subcategories.map((item) => ({ id: `${category.slug}-${item}`, title: item, subtitle: category.name, kind: 'Category' as const, href: `/shop?q=${encodeURIComponent(item)}`, keywords: `${item} ${category.name}`, priority: 1 }))]),
    ...stories.map((item) => ({ id: item.id, title: item.title, subtitle: `${item.category} · ${item.date}`, kind: 'Story' as const, href: `/stories/${item.slug}`, image: item.image, keywords: `${item.category} ${item.shortDescription}`, priority: 2 })),
    ...destinations,
  ], [liveProducts, liveVendors]);

  const results = useMemo(() => records.map((record) => ({ record, score: score(record, query) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, query ? 18 : 8).map((item) => item.record), [records, query]);
  const grouped = kindOrder.map((kind) => ({ kind, items: results.filter((item) => item.kind === kind) })).filter((group) => group.items.length);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); onOpenChange(!open); }
      if (open && event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; window.setTimeout(() => inputRef.current?.focus(), 50); }
    else { document.body.style.overflow = ''; setActiveIndex(0); }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  const remember = (term: string) => {
    if (!term.trim()) return;
    const next = [term.trim(), ...recent.filter((item) => item.toLowerCase() !== term.trim().toLowerCase())].slice(0, 5);
    setRecent(next); localStorage.setItem('merry_tales_recent_searches', JSON.stringify(next));
  };
  const choose = (record: SearchRecord) => { remember(query || record.title); onOpenChange(false); setQuery(''); navigate(record.href); };
  const showAll = () => { if (!query.trim()) return; remember(query); onOpenChange(false); navigate(`/shop?q=${encodeURIComponent(query.trim())}&scope=all`); setQuery(''); };
  const handleKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((value) => Math.min(value + 1, results.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((value) => Math.max(value - 1, 0)); }
    if (event.key === 'Enter') { event.preventDefault(); if (results[activeIndex]) choose(results[activeIndex]); else showAll(); }
  };

  if (!open) return null;
  let flatIndex = -1;
  return <div className="fixed inset-0 z-[120] bg-[#0d0d24]/60 p-0 backdrop-blur-md animate-in fade-in duration-150 sm:p-5" role="dialog" aria-modal="true" aria-label="Search MerryTales" onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}>
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white shadow-[0_35px_100px_rgba(13,13,36,.4)] sm:h-[min(760px,calc(100vh-40px))] sm:rounded-[2rem]">
      <header className="border-b px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-primary">Search all of MerryTales</p><p className="mt-1 text-xs text-slate-500">Products, vendors, services, inspiration and planning tools</p></div><button onClick={() => onOpenChange(false)} aria-label="Close search" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4"/></button></div>
        <div className="mt-5 flex items-center rounded-2xl border-2 border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(232,62,131,.08)]"><Search className="h-5 w-5 shrink-0 text-primary"/><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeys} placeholder="Try ‘photographer in Mombasa’, ‘limousine’, ‘baby shower’…" className="h-14 min-w-0 flex-1 bg-transparent px-3 text-base font-semibold outline-none placeholder:font-normal placeholder:text-slate-400"/><kbd className="hidden rounded-lg border bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-400 sm:block">ESC</kbd></div>
        {!query && <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"><span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Trending</span>{['Wedding venues','Event MC','Gift hampers','Limo hire','Ruracio decor'].map((item)=><button key={item} onClick={()=>setQuery(item)} className="shrink-0 rounded-full border bg-slate-50 px-3 py-1.5 text-xs font-semibold hover:border-primary/30 hover:bg-pink-50 hover:text-primary">{item}</button>)}</div>}
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-5">
        {!query && recent.length > 0 && <section className="mb-4"><div className="flex items-center justify-between px-2 py-2"><h2 className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400"><Clock3 className="h-3.5 w-3.5"/>Recent searches</h2><button onClick={()=>{setRecent([]);localStorage.removeItem('merry_tales_recent_searches');}} className="text-[10px] font-bold text-slate-400 hover:text-primary">Clear</button></div><div className="flex flex-wrap gap-2 px-2">{recent.map((item)=><button key={item} onClick={()=>setQuery(item)} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold hover:bg-pink-50 hover:text-primary">{item}</button>)}</div></section>}
        {grouped.length ? grouped.map(({kind,items}) => { const Icon=kindIcons[kind]; return <section key={kind} className="mb-3"><h2 className="flex items-center gap-2 px-2 py-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400"><Icon className="h-3.5 w-3.5"/>{kind}{kind==='Category'?' & services':''}</h2><div>{items.map((item)=>{flatIndex += 1; const currentIndex=flatIndex; return <button key={`${item.kind}-${item.id}`} onMouseEnter={()=>setActiveIndex(currentIndex)} onClick={()=>choose(item)} className={`group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition ${activeIndex===currentIndex?'bg-pink-50 text-primary':'hover:bg-slate-50'}`}>{item.image?<img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover"/>:<span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${activeIndex===currentIndex?'bg-primary text-white':'bg-slate-100 text-slate-500'}`}><Icon className="h-5 w-5"/></span>}<span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#10172a] group-hover:text-primary">{item.title}</strong><span className="mt-0.5 block truncate text-xs text-slate-500">{item.subtitle}</span></span><span className="hidden rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:block">{item.kind}</span><ArrowRight className={`h-4 w-4 shrink-0 transition ${activeIndex===currentIndex?'translate-x-0 text-primary':'-translate-x-1 text-slate-300 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}/></button>})}</div></section>}) : <div className="grid min-h-64 place-items-center px-6 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pink-50 text-primary"><Search className="h-6 w-6"/></span><h2 className="mt-4 font-display text-2xl font-bold">No exact match yet</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Search the wider marketplace for “{query}” or try a service, location, occasion or product name.</p><Button onClick={showAll} className="mt-5 rounded-full">Search entire marketplace</Button></div></div>}
      </div>

      <footer className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 sm:px-6"><div className="hidden items-center gap-4 text-[10px] text-slate-400 sm:flex"><span><kbd className="rounded border bg-white px-1.5 py-0.5">↑↓</kbd> Navigate</span><span><kbd className="rounded border bg-white px-1.5 py-0.5">↵</kbd> Open</span></div>{query?<button onClick={showAll} className="ml-auto flex items-center gap-2 text-xs font-extrabold text-primary">See all results for “{query}” <ArrowRight className="h-3.5 w-3.5"/></button>:<span className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-slate-400"><TrendingUp className="h-3.5 w-3.5"/>Ranked across the MerryTales marketplace</span>}</footer>
    </div>
  </div>;
}
