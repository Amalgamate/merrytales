import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

const money = (value: number) => `KES ${value.toLocaleString('en-KE')}`;

export function Cart() {
  const { items, itemCount, total, update, remove } = useCart();

  return (
    <main className="min-h-screen bg-[#fbfafb] pb-24 pt-20 text-[#10172a]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
          <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.16em] text-slate-500 transition hover:text-primary"><ArrowLeft className="h-4 w-4" /> Continue shopping</Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-primary">Your selection</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-.035em] md:text-5xl">Shopping cart</h1></div>
            {itemCount > 0 && <p className="text-sm font-semibold text-slate-500">{itemCount} {itemCount === 1 ? 'item' : 'items'} reserved for checkout</p>}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {items.length === 0 ? (
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pink-50 text-primary"><ShoppingBag className="h-7 w-7" /></span>
            <h2 className="mt-6 font-display text-3xl font-bold">Your cart is waiting for a story.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Discover event products, services, rentals and packages from trusted MerryTales vendors.</p>
            <Link to="/shop"><Button className="mt-7 rounded-full px-8 py-6 font-extrabold">Explore the marketplace <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </section>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section aria-label="Cart items" className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-7"><h2 className="font-extrabold">Items in your cart</h2></div>
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <article key={item.productId} className="grid grid-cols-[88px_1fr] gap-4 p-5 sm:grid-cols-[116px_1fr_auto] sm:gap-6 sm:p-7">
                    <Link to={`/shop/${item.productId}`} className="group row-span-2 h-24 overflow-hidden rounded-2xl bg-slate-100 sm:h-28"><img src={item.image ?? '/event_branding_mockup.png'} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></Link>
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-primary">MerryTales marketplace</p>
                      <Link to={`/shop/${item.productId}`} className="mt-1 block font-display text-lg font-bold leading-snug hover:text-primary sm:text-xl">{item.name}</Link>
                      <p className="mt-1 text-xs text-slate-500">{money(item.price)} each</p>
                    </div>
                    <strong className="col-start-2 row-start-2 self-end text-base sm:col-start-3 sm:row-start-1 sm:self-start sm:text-lg">{money(item.price * item.quantity)}</strong>
                    <div className="col-span-2 col-start-1 mt-1 flex items-center justify-between sm:col-start-2 sm:mt-0">
                      <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
                        <button aria-label={`Decrease ${item.name} quantity`} onClick={() => update(item.productId, item.quantity - 1)} className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white hover:shadow-sm"><Minus className="h-3.5 w-3.5" /></button>
                        <span aria-live="polite" className="w-9 text-center text-sm font-extrabold">{item.quantity}</span>
                        <button aria-label={`Increase ${item.name} quantity`} onClick={() => update(item.productId, item.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white hover:shadow-sm"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <button onClick={() => remove(item.productId)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-red-600"><Trash2 className="h-4 w-4" /> Remove</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-28">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <h2 className="font-display text-2xl font-bold">Order summary</h2>
                <div className="mt-6 space-y-4 border-b border-slate-100 pb-5 text-sm">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><strong className="text-[#10172a]">{money(total)}</strong></div>
                  <div className="flex justify-between gap-6 text-slate-500"><span>Delivery</span><span className="text-right font-semibold text-[#10172a]">Calculated at checkout</span></div>
                </div>
                <div className="flex items-end justify-between py-6"><span className="font-extrabold">Estimated total</span><strong className="text-2xl font-extrabold text-primary">{money(total)}</strong></div>
                <Link to="/checkout"><Button className="w-full rounded-full py-6 text-base font-extrabold shadow-[0_12px_25px_rgba(232,62,131,.22)]">Secure checkout <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">Final delivery fees depend on location, fulfilment method and seller.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ icon: ShieldCheck, label: 'Protected payment' }, { icon: PackageCheck, label: 'Verified sellers' }, { icon: Truck, label: 'Tracked fulfilment' }].map(({ icon: Icon, label }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3 text-center"><Icon className="mx-auto h-4 w-4 text-primary" /><p className="mt-2 text-[10px] font-bold leading-4 text-slate-600">{label}</p></div>)}
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
