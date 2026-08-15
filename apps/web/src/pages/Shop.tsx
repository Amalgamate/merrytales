import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '@/components/merry/ProductCard';
import { fetchProducts, toProductCard, type ProductCardModel } from '@/lib/marketplace';

export function Shop() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<ProductCardModel[]>([]);
  const [total, setTotal] = useState(0);

  const query = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const maxPrice = Number(params.get('maxPrice') ?? 0);
  const sort = params.get('sort') ?? 'recommended';
  const city = params.get('city') ?? '';
  const date = params.get('date') ?? '';
  const type = params.get('type') ?? '';

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchProducts({
      q: query || undefined,
      category: category || undefined,
      city: city || undefined,
      type: type || undefined,
      limit: 48,
    })
      .then(({ items, meta }) => {
        setProducts(items.map(toProductCard));
        setTotal(meta?.total ?? items.length);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load marketplace listings.'))
      .finally(() => setLoading(false));
  }, [query, category, city, type]);

  const categories = useMemo(() => [...new Set(products.flatMap((item) => [item.category, item.subcategory]))], [products]);

  const results = useMemo(() => {
    const filtered = products.filter((item) => !maxPrice || item.startingPrice <= maxPrice);
    return [...filtered].sort((a, b) =>
      sort === 'price-low' ? a.startingPrice - b.startingPrice
        : sort === 'price-high' ? b.startingPrice - a.startingPrice
          : sort === 'rating' ? Number(Boolean(b.bestseller)) - Number(Boolean(a.bestseller))
            : Number(Boolean(b.bestseller)) - Number(Boolean(a.bestseller)));
  }, [products, maxPrice, sort]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };
  const hasFilters = Boolean(query || category || maxPrice || city || date || type);

  const FilterPanel = () => <div className="space-y-8">
    <div><h3 className="mb-3 text-sm font-extrabold">Category</h3><div className="space-y-2"><button onClick={() => update('category', '')} className={`block text-sm ${!category ? 'font-bold text-primary' : 'text-gray-600'}`}>All categories</button>{categories.map((item) => <button key={item} onClick={() => update('category', item)} className={`block text-left text-sm ${category === item ? 'font-bold text-primary' : 'text-gray-600 hover:text-foreground'}`}>{item}</button>)}</div></div>
    <div><h3 className="mb-3 text-sm font-extrabold">Listing type</h3><div className="space-y-2">{['', 'PRODUCT', 'SERVICE', 'RENTAL', 'PACKAGE'].map((item) => <button key={item || 'all'} onClick={() => update('type', item)} className={`block text-sm ${type === item ? 'font-bold text-primary' : 'text-gray-600'}`}>{item ? item.charAt(0) + item.slice(1).toLowerCase() : 'All types'}</button>)}</div></div>
    <div><h3 className="mb-3 text-sm font-extrabold">Budget</h3><select value={maxPrice || ''} onChange={(e) => update('maxPrice', e.target.value)} className="h-11 w-full rounded-xl border bg-white px-3 text-sm"><option value="">Any budget</option><option value="3000">Up to KSh 3,000</option><option value="5000">Up to KSh 5,000</option><option value="10000">Up to KSh 10,000</option><option value="20000">Up to KSh 20,000</option><option value="50000">Up to KSh 50,000</option></select></div>
    <label className="block"><span className="mb-2 block text-sm font-extrabold">Location</span><input value={city} onChange={(e) => update('city', e.target.value)} placeholder="City or county" className="h-11 w-full rounded-xl border px-3 text-sm" /></label>
    <label className="block"><span className="mb-2 block text-sm font-extrabold">Event date</span><input type="date" value={date} onChange={(e) => update('date', e.target.value)} className="h-11 w-full rounded-xl border px-3 text-sm" /></label>
  </div>;

  return <div className="min-h-screen bg-[#f8f8fb] pb-24 pt-20">
    <header className="border-b bg-white"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-primary">Merry Tales Marketplace</p><h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Find the right fit for your event.</h1><p className="mt-2 text-sm text-gray-500">Live listings from verified Nairobi-area vendors in printing, gifts, transport and décor.</p><form onSubmit={(e) => e.preventDefault()} className="mt-7 flex max-w-3xl items-center gap-3 rounded-2xl border bg-white p-2 shadow-sm"><Search className="ml-3 h-5 w-5 text-gray-400" /><input value={query} onChange={(e) => update('q', e.target.value)} className="h-11 min-w-0 flex-1 outline-none" placeholder="Search products, services and event essentials" /><button className="h-11 rounded-xl bg-primary px-6 font-bold text-white">Search</button></form>{(city || date || type) && <div className="mt-4 flex flex-wrap gap-2">{city && <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm">Near {city}</span>}{date && <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm">Available {date}</span>}{type && <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm">{type}</span>}</div>}</div></header>
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-black">{query ? `Results for “${query}”` : 'Explore the marketplace'}</h2><p className="mt-1 text-sm text-gray-500">{loading ? 'Loading live listings…' : `${total} approved listing${total === 1 ? '' : 's'} ${city ? `near ${city}` : 'from verified vendors'}`}</p></div><div className="flex gap-2"><button onClick={() => setFiltersOpen(true)} className="flex h-11 items-center gap-2 rounded-xl border bg-white px-4 font-bold lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button><select value={sort} onChange={(e) => update('sort', e.target.value)} className="h-11 rounded-xl border bg-white px-4 text-sm font-semibold"><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select>{hasFilters && <button onClick={() => setParams({})} className="hidden items-center gap-1 px-2 text-sm font-bold text-primary sm:flex"><X className="h-4 w-4" /> Clear</button>}</div></div>
      {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]"><aside className="hidden rounded-2xl border bg-white p-5 lg:block"><FilterPanel /></aside><section>{loading ? <div className="grid min-h-64 place-items-center text-gray-400"><Loader2 className="h-8 w-8 animate-spin" /></div> : results.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{results.map((item) => <ProductCard key={item.id} {...item} />)}</div> : <div className="rounded-3xl border bg-white px-6 py-20 text-center"><Search className="mx-auto h-9 w-9 text-gray-300" /><h3 className="mt-4 text-xl font-black">No exact matches yet</h3><p className="mx-auto mt-2 max-w-md text-gray-500">Try a broader phrase or remove a filter. New verified vendors are onboarding weekly.</p><button onClick={() => setParams({})} className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-white">Explore everything</button></div>}</section></div>
    </main>
    {filtersOpen && <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setFiltersOpen(false)}><div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-white p-6" onClick={(e) => e.stopPropagation()}><div className="mb-7 flex items-center justify-between"><h2 className="text-xl font-black">Filters</h2><button onClick={() => setFiltersOpen(false)}><X /></button></div><FilterPanel /><button onClick={() => setFiltersOpen(false)} className="mt-8 h-12 w-full rounded-xl bg-primary font-bold text-white">Show {results.length} results</button></div></div>}
  </div>;
}
