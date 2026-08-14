import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, CalendarClock, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Heart, HelpCircle, Minus, Plus, RotateCcw, Share2, ShieldCheck, ShoppingBag, Star, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/merry/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { products } from '@/data/products';

const money = (value: number) => `KES ${Math.round(value).toLocaleString('en-KE')}`;
const finishes = [
  { name: 'Standard', adjustment: 0, note: 'Smooth matte finish' },
  { name: 'Premium Texture', adjustment: 650, note: 'Tactile luxury stock' },
  { name: 'Gold Foil', adjustment: 1400, note: 'Metallic foil accents' },
];
const packs = [
  { name: '25 pieces', multiplier: 1 },
  { name: '50 pieces', multiplier: 1.72, badge: 'Popular' },
  { name: '100 pieces', multiplier: 3.1, badge: 'Best value' },
];
const sampleReviews = [
  { name: 'Wanjiku M.', rating: 5, date: '12 July 2026', title: 'The finish looked beautiful in person', body: 'The colours matched our theme and the approval process was easy. Delivery arrived before our ruracio weekend.', verified: true, helpful: 18 },
  { name: 'Brian O.', rating: 5, date: '28 June 2026', title: 'Very clear print and careful packaging', body: 'We ordered the premium texture option. The team shared a proof, corrected one name and delivered exactly what we approved.', verified: true, helpful: 11 },
  { name: 'Amina K.', rating: 4, date: '03 June 2026', title: 'Lovely result', body: 'The labels were elegant and easy to apply. I would order a few extra pieces above the guest count.', verified: true, helpful: 7 },
];

export function ProductDetail() {
  const { slug } = useParams();
  const { add } = useCart();
  const product = products.find((item) => item.slug === slug);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [finish, setFinish] = useState(finishes[0]);
  const [pack, setPack] = useState(packs[0]);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('Most helpful');
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState([{ author: 'Grace N.', question: 'Can the gold text be changed to rose gold?', answer: 'Yes. Choose Customize Design after adding the item and include rose gold in your brief.', date: '2 weeks ago' }]);

  const related = useMemo(() => product ? products.filter((item) => item.id !== product.id && (item.category === product.category || item.customizable === product.customizable)).slice(0, 4) : [], [product]);

  if (!product) return <main className="grid min-h-screen place-items-center px-4 pt-20 text-center"><div><ShoppingBag className="mx-auto h-10 w-10 text-slate-300"/><h1 className="mt-4 font-display text-3xl font-bold">Product not found</h1><Link to="/shop"><Button className="mt-6 rounded-full">Return to marketplace</Button></Link></div></main>;

  const gallery = product.images?.length ? product.images : [product.image];
  const unitPrice = product.digital ? product.startingPrice : (product.startingPrice + finish.adjustment) * pack.multiplier;
  const lineTotal = unitPrice * quantity;
  const selectPrevious = () => setSelectedImageIndex((value) => value === 0 ? gallery.length - 1 : value - 1);
  const selectNext = () => setSelectedImageIndex((value) => value === gallery.length - 1 ? 0 : value + 1);
  const addToCart = () => {
    const configuration = product.digital ? 'Digital' : `${finish.name}, ${pack.name}`;
    add({ productId: product.slug, name: `${product.name} — ${configuration}`, price: unitPrice, image: product.image }, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2600);
  };
  const submitQuestion = () => {
    if (!question.trim()) return;
    setQuestions((current) => [{ author: 'You', question: question.trim(), answer: '', date: 'Just now' }, ...current]);
    setQuestion('');
  };

  return (
    <main className="min-h-screen bg-[#fcfbfc] pb-28 pt-20 text-[#10172a]">
      <div className="border-b bg-white">
        <nav aria-label="Breadcrumb" className="mx-auto flex max-w-7xl items-center gap-2 overflow-hidden px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8"><Link to="/" className="hover:text-primary">Home</Link><span>/</span><Link to="/shop" className="hover:text-primary">Shop</Link><span>/</span><span className="truncate">{product.category}</span><span>/</span><strong className="truncate text-[#10172a]">{product.name}</strong></nav>
      </div>

      <section className="mx-auto grid max-w-7xl gap-9 px-4 py-8 sm:px-6 md:py-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(390px,.96fr)] lg:gap-14 lg:px-8">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <img src={gallery[selectedImageIndex]} alt={`${product.name}, view ${selectedImageIndex + 1}`} className="h-full w-full object-contain p-4 transition duration-500 sm:p-7" />
            {product.bestseller && <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-lg">Bestseller</span>}
            <button onClick={() => setSaved(!saved)} aria-label={saved ? 'Remove from saved items' : 'Save product'} className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border bg-white shadow-sm transition ${saved ? 'border-primary text-primary' : 'border-slate-200 text-slate-500 hover:text-primary'}`}><Heart className={`h-5 w-5 ${saved ? 'fill-current' : ''}`}/></button>
            {gallery.length > 1 && <><button onClick={selectPrevious} aria-label="Previous product image" className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border bg-white/95 shadow-lg hover:text-primary"><ChevronLeft/></button><button onClick={selectNext} aria-label="Next product image" className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border bg-white/95 shadow-lg hover:text-primary"><ChevronRight/></button><span className="absolute bottom-4 right-4 rounded-full bg-[#10172a]/80 px-3 py-1 text-[10px] font-bold text-white backdrop-blur">{selectedImageIndex + 1} / {gallery.length}</span></>}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">{gallery.map((image, index) => <button key={image} onClick={() => setSelectedImageIndex(index)} aria-label={`View product image ${index + 1}`} className={`aspect-[4/3] overflow-hidden rounded-xl border-2 bg-white p-1 transition ${index === selectedImageIndex ? 'border-primary shadow-sm' : 'border-transparent opacity-65 hover:opacity-100'}`}><img src={image} alt="" className="h-full w-full rounded-lg object-cover"/></button>)}</div>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-primary">{product.subcategory}</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-[1.05] tracking-[-.035em] md:text-5xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><button onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 font-bold text-amber-800"><Star className="h-4 w-4 fill-amber-400 text-amber-400"/>{product.rating} <span className="font-normal text-amber-700">({product.reviews} reviews)</span></button><span className="inline-flex items-center gap-1.5 text-green-700"><BadgeCheck className="h-4 w-4"/> Verified purchase reviews</span></div>
          <div className="mt-6 flex items-end gap-3"><strong className="text-3xl font-extrabold tracking-tight">{money(unitPrice)}</strong>{!product.digital && pack.multiplier > 1 && <span className="mb-1 text-xs text-slate-400">for {pack.name}</span>}</div>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-slate-600">Designed to feel personal, polished and unmistakably yours. Customize names, dates, colours and wording, then approve a digital proof before production begins.</p>

          <div className="mt-7 space-y-7 border-t border-slate-200 pt-7">
            {!product.digital && <>
              <fieldset><legend className="flex w-full items-center justify-between text-sm font-extrabold"><span>1. Choose finish</span><span className="font-normal text-slate-400">{finish.note}</span></legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{finishes.map((option) => <button key={option.name} onClick={() => setFinish(option)} className={`relative rounded-2xl border p-3 text-left transition ${finish.name === option.name ? 'border-primary bg-primary/[.045] shadow-[0_0_0_2px_rgba(232,62,131,.09)]' : 'border-slate-200 hover:border-slate-300'}`}><strong className="block text-sm">{option.name}</strong><span className="mt-1 block text-[11px] text-slate-500">{option.adjustment ? `+ ${money(option.adjustment)}` : 'Included'}</span>{finish.name === option.name && <Check className="absolute right-3 top-3 h-4 w-4 text-primary"/>}</button>)}</div></fieldset>
              <fieldset><legend className="text-sm font-extrabold">2. Select pack size</legend><div className="mt-3 grid grid-cols-3 gap-2">{packs.map((option) => <button key={option.name} onClick={() => setPack(option)} className={`relative rounded-2xl border px-2 py-3 text-center transition ${pack.name === option.name ? 'border-primary bg-primary/[.045] text-primary' : 'border-slate-200 hover:border-slate-300'}`}><strong className="block text-xs sm:text-sm">{option.name}</strong>{option.badge && <span className="mt-1 block text-[9px] font-bold uppercase tracking-wide text-slate-400">{option.badge}</span>}</button>)}</div></fieldset>
            </>}
            <div className="flex items-end justify-between gap-4"><div><p className="text-sm font-extrabold">{product.digital ? 'Quantity' : '3. Number of packs'}</p><div className="mt-3 flex w-32 items-center rounded-full border border-slate-200 bg-white p-1"><button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100"><Minus className="h-4 w-4"/></button><input aria-label="Quantity" type="number" min="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} className="min-w-0 flex-1 bg-transparent text-center text-sm font-extrabold outline-none"/><button aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100"><Plus className="h-4 w-4"/></button></div></div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Line total</p><strong className="mt-1 block text-xl">{money(lineTotal)}</strong></div></div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]"><Button onClick={addToCart} className="h-14 rounded-full text-base font-extrabold shadow-[0_12px_28px_rgba(232,62,131,.24)]">{added ? <><CheckCircle2 className="mr-2 h-5 w-5"/>Added to cart</> : <><ShoppingBag className="mr-2 h-5 w-5"/>Add to cart · {money(lineTotal)}</>}</Button><button onClick={() => navigator.share?.({ title: product.name, url: window.location.href })} className="grid h-14 place-items-center rounded-full border border-slate-200 px-5 hover:border-primary hover:text-primary" aria-label="Share product"><Share2 className="h-5 w-5"/></button></div>
          {product.customizable && <button className="mt-3 w-full rounded-full border border-primary/25 bg-pink-50/60 py-3.5 text-sm font-extrabold text-primary transition hover:bg-pink-50">Customize after adding — proof included</button>}

          <div className="mt-7 grid grid-cols-3 divide-x rounded-2xl border border-slate-200 bg-white py-4">{[{icon:CalendarClock,title:product.digital?'Delivered instantly':'3–5 day dispatch',copy:'After approval'},{icon:ShieldCheck,title:'Secure checkout',copy:'M-Pesa & card'},{icon:RotateCcw,title:'Proof guarantee',copy:'Approve before print'}].map(({icon:Icon,title,copy}) => <div key={title} className="px-3 text-center"><Icon className="mx-auto h-5 w-5 text-primary"/><strong className="mt-2 block text-[11px] sm:text-xs">{title}</strong><span className="mt-0.5 block text-[9px] text-slate-400 sm:text-[10px]">{copy}</span></div>)}</div>

          <div className="mt-6 divide-y rounded-2xl border border-slate-200 bg-white px-5">{[{title:'What is included?',body:`Design customization, one digital proof, production of the selected ${product.digital ? 'digital item' : 'pack size'}, and quality inspection.`},{title:'Delivery, collection & returns',body:product.digital?'Your final files become available in your workspace after approval.':'Delivery is calculated at checkout by county. Personalized goods cannot be returned after approval unless faulty or different from the approved proof.'},{title:'Need help before ordering?',body:'Ask a product question below or contact MerryTales support for material, quantity and timeline guidance.'}].map((item)=><details key={item.title} className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-extrabold">{item.title}<ChevronDown className="h-4 w-4 transition group-open:rotate-180"/></summary><p className="pt-3 text-sm leading-6 text-slate-500">{item.body}</p></details>)}</div>
        </div>
      </section>

      <section id="reviews" className="border-y border-slate-200 bg-white py-16 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-primary">Customer confidence</p><h2 className="mt-2 font-display text-3xl font-bold">Ratings & reviews</h2><div className="mt-6 flex items-end gap-3"><strong className="text-5xl">{product.rating}</strong><div className="pb-1"><div className="flex text-amber-400">{[1,2,3,4,5].map((value)=><Star key={value} className="h-4 w-4 fill-current"/>)}</div><p className="mt-1 text-xs text-slate-500">Based on {product.reviews} reviews</p></div></div><div className="mt-6 space-y-2">{[5,4,3,2,1].map((value)=><div key={value} className="flex items-center gap-2 text-xs"><span className="w-3">{value}</span><Star className="h-3 w-3 fill-amber-400 text-amber-400"/><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-amber-400" style={{width:value===5?'82%':value===4?'14%':'2%'}}/></span></div>)}</div><Button variant="outline" className="mt-7 rounded-full">Write a review</Button></div>
            <div><div className="flex items-center justify-between border-b pb-4"><strong>What customers are saying</strong><select value={reviewFilter} onChange={(event)=>setReviewFilter(event.target.value)} className="rounded-xl border px-3 py-2 text-xs font-semibold"><option>Most helpful</option><option>Newest</option><option>Highest rated</option></select></div><div className="divide-y">{sampleReviews.map((review)=><article key={review.name} className="py-6"><div className="flex flex-wrap items-center gap-2"><div className="flex text-amber-400">{Array.from({length:review.rating},(_,index)=><Star key={index} className="h-3.5 w-3.5 fill-current"/>)}</div><strong className="text-sm">{review.title}</strong></div><p className="mt-3 text-sm leading-6 text-slate-600">{review.body}</p><div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-400"><strong className="text-slate-600">{review.name}</strong>{review.verified&&<span className="inline-flex items-center gap-1 text-green-700"><BadgeCheck className="h-3.5 w-3.5"/>Verified purchase</span>}<span>{review.date}</span><button className="ml-auto inline-flex items-center gap-1 hover:text-primary"><ThumbsUp className="h-3.5 w-3.5"/>Helpful ({review.helpful})</button></div></article>)}</div></div>
          </div>
        </div>
      </section>

      <section className="bg-[#fcfbfc] py-16"><div className="mx-auto max-w-4xl px-4 sm:px-6"><div className="text-center"><HelpCircle className="mx-auto h-7 w-7 text-primary"/><h2 className="mt-3 font-display text-3xl font-bold">Questions & comments</h2><p className="mt-2 text-sm text-slate-500">Ask about materials, customization, quantities or delivery before you order.</p></div><div className="mx-auto mt-7 flex max-w-2xl gap-2 rounded-2xl border bg-white p-2 shadow-sm"><input value={question} onChange={(event)=>setQuestion(event.target.value)} onKeyDown={(event)=>{if(event.key==='Enter')submitQuestion();}} placeholder="Ask a question about this product…" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"/><Button onClick={submitQuestion} disabled={!question.trim()} className="rounded-xl">Post</Button></div><div className="mx-auto mt-7 max-w-2xl space-y-3">{questions.map((item,index)=><article key={`${item.author}-${index}`} className="rounded-2xl border bg-white p-5"><div className="flex items-center justify-between"><strong className="text-sm">{item.author}</strong><span className="text-[10px] text-slate-400">{item.date}</span></div><p className="mt-2 text-sm text-slate-700">{item.question}</p>{item.answer?<div className="mt-4 rounded-xl bg-pink-50/70 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">MerryTales answer</p><p className="mt-1.5 text-sm leading-6 text-slate-600">{item.answer}</p></div>:<p className="mt-3 text-xs text-amber-700">Awaiting a verified answer</p>}</article>)}</div></div></section>

      {related.length > 0 && <section className="bg-white py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-end justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-primary">Complete the occasion</p><h2 className="mt-2 font-display text-3xl font-bold">You may also like</h2></div><Link to="/shop" className="text-sm font-extrabold text-primary">View all</Link></div><div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 sm:gap-6">{related.map((item)=><ProductCard key={item.id} {...item}/>)}</div></div></section>}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 p-3 shadow-[0_-12px_35px_rgba(16,23,42,.1)] backdrop-blur-lg md:hidden"><div className="mx-auto flex max-w-lg items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-[10px] text-slate-500">{product.name}</p><strong className="text-sm">{money(lineTotal)}</strong></div><Button onClick={addToCart} className="rounded-full px-6 font-extrabold">{added ? 'Added' : 'Add to cart'}</Button></div></div>
    </main>
  );
}
