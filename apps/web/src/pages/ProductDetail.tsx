import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, CalendarClock, CheckCircle2, ChevronLeft, Loader2, MessageSquare, RotateCcw, ShieldCheck, ShoppingBag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/merry/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { fetchProduct, fetchProducts, priceLabel, productImage, submitLead, toProductCard, type ApiProduct } from '@/lib/marketplace';

const money = (value: number) => `KES ${Math.round(value).toLocaleString('en-KE')}`;

export function ProductDetail() {
  const { slug } = useParams();
  const { add } = useCart();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [related, setRelated] = useState<ReturnType<typeof toProductCard>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [quoteNotice, setQuoteNotice] = useState('');
  const [quoteForm, setQuoteForm] = useState({ name: '', phone: '', email: '', eventDate: '', message: '' });

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError('');
    fetchProduct(slug)
      .then(async (item) => {
        setProduct(item);
        setQuantity(item.minimumOrder || 1);
        const { items } = await fetchProducts({ category: item.category, limit: 5 });
        setRelated(items.filter((entry) => entry.slug !== item.slug).slice(0, 4).map(toProductCard));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Listing not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const unitPrice = useMemo(() => (product ? Number(product.price) : 0), [product]);
  const lineTotal = unitPrice * quantity;
  const isQuoteOnly = product?.priceUnit === 'QUOTE' || product?.listingType === 'SERVICE' || product?.listingType === 'RENTAL';

  const addToCart = () => {
    if (!product) return;
    add({ productId: product.id, name: product.name, price: unitPrice, image: productImage(product.category, product.listingType) }, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2600);
  };

  const sendQuote = async () => {
    if (!product?.vendor?.id) return;
    setQuoteBusy(true);
    setQuoteNotice('');
    try {
      await submitLead({
        vendorId: product.vendor.id,
        name: quoteForm.name,
        phone: quoteForm.phone || undefined,
        email: quoteForm.email || undefined,
        eventDate: quoteForm.eventDate ? new Date(`${quoteForm.eventDate}T09:00:00`).toISOString() : undefined,
        message: quoteForm.message || `Quote request for ${product.name}.`,
      });
      setQuoteNotice('Your request was sent. The vendor will respond through Merry Tales.');
      setQuoteOpen(false);
    } catch (cause) {
      setQuoteNotice(cause instanceof Error ? cause.message : 'Unable to send request.');
    } finally {
      setQuoteBusy(false);
    }
  };

  if (loading) return <main className="grid min-h-screen place-items-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;
  if (!product || error) return <main className="grid min-h-screen place-items-center px-4 pt-20 text-center"><div><ShoppingBag className="mx-auto h-10 w-10 text-slate-300" /><h1 className="mt-4 font-display text-3xl font-bold">{error || 'Product not found'}</h1><Link to="/shop"><Button className="mt-6 rounded-full">Return to marketplace</Button></Link></div></main>;

  const image = productImage(product.category, product.listingType);

  return (
    <main className="min-h-screen bg-[#fcfbfc] pb-28 pt-20 text-[#10172a]">
      <div className="border-b bg-white">
        <nav aria-label="Breadcrumb" className="mx-auto flex max-w-7xl items-center gap-2 overflow-hidden px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8"><Link to="/" className="hover:text-primary">Home</Link><span>/</span><Link to="/shop" className="hover:text-primary">Shop</Link><span>/</span><span className="truncate">{product.category}</span><span>/</span><strong className="truncate text-[#10172a]">{product.name}</strong></nav>
      </div>

      <section className="mx-auto grid max-w-7xl gap-9 px-4 py-8 sm:px-6 md:py-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(390px,.96fr)] lg:gap-14 lg:px-8">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <img src={image} alt={product.name} className="h-full w-full object-contain p-4 sm:p-7" />
            {product.vendor && <span className="absolute left-4 top-4 rounded-full bg-green-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-green-800">Verified vendor</span>}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-primary">{product.listingType.replace('_', ' ')} · {product.category}</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-[1.05] tracking-[-.035em] md:text-5xl">{product.name}</h1>
          {product.vendor && <div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><Link to={`/vendors/${product.vendor.slug}`} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 font-bold hover:text-primary"><BadgeCheck className="h-4 w-4 text-green-600" />{product.vendor.businessName} · {product.vendor.city}</Link>{product.vendor.rating && <span className="inline-flex items-center gap-1 text-amber-700"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{Number(product.vendor.rating).toFixed(1)}</span>}</div>}
          <div className="mt-6 flex items-end gap-3"><strong className="text-3xl font-extrabold tracking-tight">{priceLabel(product)}</strong></div>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-slate-600">{product.description ?? 'Verified marketplace listing with transparent pricing, secure checkout and tracked fulfilment through Merry Tales.'}</p>

          <div className="mt-7 space-y-5 border-t border-slate-200 pt-7">
            <div className="grid gap-3 sm:grid-cols-2 text-sm">{product.serviceArea && <div className="rounded-2xl border p-4"><strong className="block">Service area</strong><span className="text-slate-500">{product.serviceArea}</span></div>}<div className="rounded-2xl border p-4"><strong className="block">Lead time</strong><span className="text-slate-500">{product.leadTimeDays ? `${product.leadTimeDays} day(s)` : 'Contact vendor'}</span></div>{product.depositAmount && <div className="rounded-2xl border p-4"><strong className="block">Deposit</strong><span className="text-slate-500">{money(Number(product.depositAmount))}</span></div>}</div>
            {!isQuoteOnly && <div><p className="text-sm font-extrabold">Quantity</p><div className="mt-3 flex w-32 items-center rounded-full border border-slate-200 bg-white p-1"><button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(product.minimumOrder, quantity - 1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100">−</button><input aria-label="Quantity" type="number" min={product.minimumOrder} value={quantity} onChange={(event) => setQuantity(Math.max(product.minimumOrder, Number(event.target.value) || product.minimumOrder))} className="min-w-0 flex-1 bg-transparent text-center text-sm font-extrabold outline-none" /><button aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100">+</button></div><p className="mt-2 text-xs text-slate-500">Minimum order: {product.minimumOrder}{product.maximumOrder ? ` · Maximum: ${product.maximumOrder}` : ''}</p></div>}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
            {isQuoteOnly ? <Button onClick={() => setQuoteOpen(true)} className="h-14 rounded-full text-base font-extrabold"><MessageSquare className="mr-2 h-5 w-5" />Request a quote</Button> : <Button onClick={addToCart} className="h-14 rounded-full text-base font-extrabold shadow-[0_12px_28px_rgba(232,62,131,.24)]">{added ? <><CheckCircle2 className="mr-2 h-5 w-5" />Added to cart</> : <><ShoppingBag className="mr-2 h-5 w-5" />Add to cart · {money(lineTotal)}</>}</Button>}
          </div>

          <div className="mt-7 grid grid-cols-3 divide-x rounded-2xl border border-slate-200 bg-white py-4">{[{ icon: CalendarClock, title: product.isDigital ? 'Delivered digitally' : `${product.leadTimeDays || 3} day lead time`, copy: 'After confirmation' }, { icon: ShieldCheck, title: 'Secure checkout', copy: 'M-Pesa protected' }, { icon: RotateCcw, title: 'Verified listing', copy: 'Approved vendor' }].map(({ icon: Icon, title, copy }) => <div key={title} className="px-3 text-center"><Icon className="mx-auto h-5 w-5 text-primary" /><strong className="mt-2 block text-[11px] sm:text-xs">{title}</strong><span className="mt-0.5 block text-[9px] text-slate-400 sm:text-[10px]">{copy}</span></div>)}</div>
          {product.terms && <div className="mt-6 rounded-2xl border bg-white p-5 text-sm leading-6 text-slate-600"><strong className="block text-[#10172a]">Terms</strong>{product.terms}</div>}
        </div>
      </section>

      {related.length > 0 && <section className="bg-white py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-end justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-primary">Complete the occasion</p><h2 className="mt-2 font-display text-3xl font-bold">You may also like</h2></div><Link to="/shop" className="text-sm font-extrabold text-primary">View all</Link></div><div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 sm:gap-6">{related.map((item) => <ProductCard key={item.id} {...item} />)}</div></div></section>}

      {quoteOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Request a quote</h2><button onClick={() => setQuoteOpen(false)}><ChevronLeft className="h-5 w-5 rotate-180" /></button></div><p className="mt-2 text-sm text-gray-500">Tell {product.vendor?.businessName} about your event and they will respond through Merry Tales.</p><div className="mt-5 space-y-3"><Input placeholder="Your name" value={quoteForm.name} onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })} /><Input placeholder="Phone / WhatsApp" value={quoteForm.phone} onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })} /><Input placeholder="Email (optional)" value={quoteForm.email} onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })} /><Input type="date" value={quoteForm.eventDate} onChange={(e) => setQuoteForm({ ...quoteForm, eventDate: e.target.value })} /><textarea value={quoteForm.message} onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })} placeholder={`I'm interested in ${product.name}…`} className="min-h-24 w-full rounded-xl border p-3 text-sm" /></div>{quoteNotice && <p className="mt-3 text-sm text-primary">{quoteNotice}</p>}<Button disabled={quoteBusy || !quoteForm.name || !quoteForm.phone} onClick={() => void sendQuote()} className="mt-5 w-full rounded-full">{quoteBusy ? 'Sending…' : 'Send quote request'}</Button></div></div>}
    </main>
  );
}
