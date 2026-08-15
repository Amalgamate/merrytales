import { Star, ArrowRight, ArrowUpRight, Heart, Calendar, Users, ShoppingBag, Gift, Ticket, Building2, Plug, BadgeCheck, ShieldCheck, CreditCard, Clock3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { VendorCard } from '@/components/merry/VendorCard';
import { ProductCard } from '@/components/merry/ProductCard';
import { stories } from '@/data/stories';
import { fetchProducts, fetchVendors, toProductCard, toVendorCard, type ProductCardModel, type VendorCardModel } from '@/lib/marketplace';
import { MarketplaceSearchHero } from '@/components/merry/MarketplaceSearchHero';
import { FeaturedStoryVideo } from '@/components/merry/FeaturedStoryVideo';
import { FloatingGiftIcons } from '@/components/merry/FloatingGiftIcons';

const discoveryCategories = [
  { name: 'Venues', query: 'Venues', image: '/african_garden_wedding.png', note: 'Spaces worth gathering in' },
  { name: 'Catering', query: 'Catering', image: '/hero_vibrant.png', note: 'Menus made memorable' },
  { name: 'Decor & Styling', query: 'Decor', image: '/event_branding_mockup.png', note: 'Transform every setting' },
  { name: 'Photography', query: 'Photography', image: '/african_vendor_photography.png', note: 'Keep every feeling' },
  { name: 'Invitations', query: 'Invitations', image: '/printable_invitation_cards.png', note: 'Set the tone beautifully' },
  { name: 'Rentals', query: 'Rentals', image: '/african_planning_hero.png', note: 'Everything for the day' },
  { name: 'Entertainment', query: 'Entertainment', image: '/african_stories_hero.png', note: 'Bring the room alive' },
  { name: 'Beauty & Glam', query: 'Beauty', image: '/style_story_tale.png', note: 'Look and feel your best' },
];

export function Home() {
  const [featuredVendors, setFeaturedVendors] = useState<VendorCardModel[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductCardModel[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const featuredStory = stories[0];

  useEffect(() => {
    Promise.all([fetchVendors({ limit: 3 }), fetchProducts({ limit: 8 })])
      .then(([vendorResult, productResult]) => {
        setFeaturedVendors(vendorResult.items.slice(0, 3).map(toVendorCard));
        setFeaturedProducts(productResult.items.filter((item) => Number(item.price) >= 2500).slice(0, 4).map(toProductCard));
      })
      .catch(() => {
        setFeaturedVendors([]);
        setFeaturedProducts([]);
      })
      .finally(() => setMarketLoading(false));
  }, []);

  return (
    <div className="pt-20 min-h-screen">
      
      <MarketplaceSearchHero />

      <section className="relative z-10 border-y border-slate-200/70 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200/70 px-4 sm:px-6 md:grid-cols-4 md:divide-y-0 lg:px-8">
          {[
            { icon: BadgeCheck, title: 'Trusted vendors', copy: 'Verified & reviewed' },
            { icon: ShieldCheck, title: 'Quality assured', copy: 'Standards you can trust' },
            { icon: CreditCard, title: 'Secure payments', copy: 'Protected transactions' },
            { icon: Clock3, title: 'Easy planning', copy: 'Book with less stress' },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex items-center gap-3 px-3 py-5 sm:px-5 lg:py-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink-50 text-primary"><Icon className="h-[18px] w-[18px]" /></span>
              <span><strong className="block text-xs font-extrabold text-[#10172a] sm:text-sm">{title}</strong><small className="mt-0.5 block text-[10px] text-slate-500 sm:text-xs">{copy}</small></span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-5">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-primary">Find your people</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-.025em] text-[#10172a] md:text-4xl">Explore by category</h2></div>
            <Link to="/shop" className="hidden items-center gap-1 text-sm font-extrabold text-primary hover:underline sm:flex">View all <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 lg:gap-4">
            {discoveryCategories.map((category, index) => (
              <Link key={category.name} to={`/shop?q=${encodeURIComponent(category.query)}`} className="category-reveal group relative isolate aspect-[.84/1] overflow-hidden rounded-[1.25rem] bg-[#10172a] shadow-sm outline-none ring-primary/40 transition duration-500 hover:-translate-y-2 hover:shadow-[0_22px_40px_rgba(16,23,42,.22)] focus-visible:ring-4">
                <img src={category.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110 group-hover:rotate-[1deg]" />
                <span className="absolute inset-0 bg-gradient-to-t from-[#10172a]/95 via-[#10172a]/5 to-transparent transition duration-500 group-hover:from-primary/90 group-hover:via-[#10172a]/15" />
                <span className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <span className="flex items-end justify-between gap-2"><strong className="text-xs leading-tight sm:text-sm">{category.name}</strong><span className="grid h-7 w-7 shrink-0 translate-y-3 place-items-center rounded-full bg-white text-[#10172a] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight className="h-3.5 w-3.5" /></span></span>
                  <small className="mt-1 block max-h-0 translate-y-2 overflow-hidden text-[10px] leading-4 text-white/80 opacity-0 transition-all duration-500 group-hover:max-h-10 group-hover:translate-y-0 group-hover:opacity-100">{category.note}</small>
                </span>
                <span className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-white/30 bg-white/15 text-[10px] font-extrabold text-white backdrop-blur-sm">{String(index + 1).padStart(2, '0')}</span>
              </Link>
            ))}
          </div>
          <Link to="/shop" className="mt-7 flex items-center justify-center gap-1 text-sm font-extrabold text-primary sm:hidden">View all categories <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* Strategic gifting entry point */}
      <section data-cursor-focus="light" className="relative z-10 bg-[#171735] py-16 text-white md:py-20">
        <FloatingGiftIcons />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
          <div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-pink-300">Give beautifully</p><h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">Registries, group gifts and moments worth sponsoring.</h2><p className="mt-5 max-w-xl leading-7 text-white/70">Shop for someone special, help a group complete one meaningful gift, or support a host, guest, family or corporate delegate.</p><Link to="/gifts"><Button className="mt-7 rounded-full bg-white px-8 py-6 font-bold text-[#171735] hover:bg-pink-50">Explore gifts & registries <ArrowRight className="ml-2 h-4 w-4"/></Button></Link></div>
          <div className="grid gap-4 sm:grid-cols-3">{[{icon:Gift,title:'Send a gift',copy:'Digital, physical or scheduled.'},{icon:Users,title:'Build a registry',copy:'Items, group goals and experiences.'},{icon:Ticket,title:'Sponsor a moment',copy:'Seats, services, travel or meals.'}].map(({icon:Icon,title,copy})=><div key={title} className="rounded-3xl border border-white/10 bg-white/10 p-5"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-400 text-[#171735]"><Icon className="h-5 w-5"/></div><h3 className="mt-4 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/60">{copy}</p></div>)}</div>
        </div>
      </section>

      {/* 3. MerryTales story video */}
      <FeaturedStoryVideo />

      {/* 3.5 Who We Are */}
      <section className="bg-background py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img src="/logo.png" alt="Merry Tales" className="h-24 md:h-32 w-auto mx-auto mb-8" />
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6">Who We Are</h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
            Merry Tales is a Kenyan event marketplace and planning platform for personal, cultural and corporate occasions. Discover trusted vendors, create invitations and event branding, shop event essentials, and manage the details of your occasion in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold uppercase tracking-wider text-primary">
            <span>Create</span> • <span>Shop</span> • <span>Find</span> • <span>Plan</span> • <span>Celebrate</span>
          </div>
        </div>
      </section>

      {/* 4. Three Paths */}
      <section className="bg-lavender-light py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">Everything you need for a well-run event.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-soft border border-border-soft flex flex-col h-full hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Create Your Story</h3>
              <p className="text-gray-600 mb-8 flex-grow">Bring your journey to life with cinematic animated invitations and beautiful event websites.</p>
              <Link to="/create"><Button className="w-full rounded-full font-bold">Start Creating</Button></Link>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-soft border border-border-soft flex flex-col h-full hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center text-primary mb-6">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Shop Your Details</h3>
              <p className="text-gray-600 mb-8 flex-grow">From water bottle labels to welcome signs, shop custom printables that match your style perfectly.</p>
              <Link to="/shop"><Button className="w-full rounded-full font-bold">Visit Shop</Button></Link>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-soft border border-border-soft flex flex-col h-full hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Find Your People</h3>
              <p className="text-gray-600 mb-8 flex-grow">Discover trusted event professionals across Kenya, from photographers and caterers to decorators and technical teams.</p>
              <Link to="/vendors"><Button className="w-full rounded-full font-bold">Explore Vendors</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Wedding Shop */}
      <section className="bg-background py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Boutique</p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">Shop The Collection</h2>
            </div>
            <Link to="/shop" className="text-primary font-bold hover:underline hidden sm:flex items-center">
              View All Products <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {marketLoading ? <div className="col-span-full grid min-h-40 place-items-center text-gray-400"><Loader2 className="h-8 w-8 animate-spin" /></div> : featuredProducts.length ? featuredProducts.map(product => (
              <ProductCard key={product.id} {...product} />
            )) : <p className="col-span-full text-center text-gray-500">Verified listings appear here as vendors go live.</p>}
          </div>
          
          <Link to="/shop" className="sm:hidden mt-8 block">
            <Button variant="outline" className="w-full rounded-full font-bold">View All Products</Button>
          </Link>
        </div>
      </section>

      {/* 6. Featured Vendors */}
      <section className="border-y border-border-soft bg-lavender-light/50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Marketplace</p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">Top Rated Vendors</h2>
            </div>
            <Link to="/vendors" className="text-primary font-bold hover:underline hidden sm:flex items-center">
              View All Vendors <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {marketLoading ? <div className="col-span-full grid min-h-40 place-items-center text-gray-400"><Loader2 className="h-8 w-8 animate-spin" /></div> : featuredVendors.length ? featuredVendors.map(vendor => (
              <VendorCard key={vendor.id} {...vendor} />
            )) : <p className="col-span-full text-center text-gray-500">Verified vendors appear here as onboarding completes.</p>}
          </div>
          
          <Link to="/vendors" className="sm:hidden mt-8 block">
            <Button variant="outline" className="w-full rounded-full font-bold">View All Vendors</Button>
          </Link>
        </div>
      </section>

      {/* 7. Event Brand Kit */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2 order-2 lg:order-1 relative">
              <div className="bg-secondary/10 rounded-[40px] p-8 md:p-12 shadow-soft border border-secondary/20">
                <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Complete Event Branding</p>
                <h3 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6">One Story. One Style.</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Get a complete event identity for your celebration. Everything matches — from your digital WhatsApp invitation to your physical water bottle labels and table cards.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center font-medium"><Star className="text-primary h-5 w-5 mr-3" /> Custom monograms & logos</li>
                  <li className="flex items-center font-medium"><Star className="text-primary h-5 w-5 mr-3" /> Matching typography & colors</li>
                  <li className="flex items-center font-medium"><Star className="text-primary h-5 w-5 mr-3" /> Seamless digital-to-print experience</li>
                </ul>
                <Link to="/create">
                  <Button className="rounded-full px-8 py-6 font-bold shadow-soft">Create Your Brand Kit</Button>
                </Link>
              </div>
            </div>
            <div className="w-full lg:w-1/2 order-1 lg:order-2">
              <img src="/event_branding_mockup.png" alt="Event Branding Kit" className="w-full h-auto drop-shadow-2xl rounded-3xl transform lg:rotate-3 transition-transform hover:rotate-0 duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* 8. Real Wedding Story */}
      {featuredStory && (
        <section className="bg-foreground py-16 text-white md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="w-full md:w-1/2">
                <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Event Stories</p>
                <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
                  "{featuredStory.shortDescription}"
                </h2>
                <p className="text-lg text-white font-medium mb-8">{featuredStory.title}</p>
                <Link to={`/stories/${featuredStory.slug}`}>
                  <Button className="rounded-full font-bold bg-white text-foreground hover:bg-gray-100 px-8 py-6">Read Their Story</Button>
                </Link>
              </div>
              <div className="w-full md:w-1/2">
                <div className="rounded-[40px] overflow-hidden shadow-2xl border-4 border-white/10 aspect-square md:aspect-video">
                  <img src={featuredStory.image} alt="A featured Merry Tales event" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 9. Wedding Planning */}
      <section className="bg-background py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">The Planning Center</p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6">Stay on top of every detail.</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">Manage your guest list, track your budget, and keep your checklist organized with our free planning tools.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-lavender-light flex items-center justify-center mb-4"><Calendar className="h-8 w-8 text-primary" /></div>
              <h3 className="font-bold text-xl mb-2">Checklist</h3>
              <p className="text-gray-500 text-sm">A personalized timeline of tasks.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-lavender-light flex items-center justify-center mb-4"><Users className="h-8 w-8 text-primary" /></div>
              <h3 className="font-bold text-xl mb-2">Guest List</h3>
              <p className="text-gray-500 text-sm">RSVPs and seating arrangements.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-lavender-light flex items-center justify-center mb-4"><Heart className="h-8 w-8 text-primary" /></div>
              <h3 className="font-bold text-xl mb-2">Vendor Team</h3>
              <p className="text-gray-500 text-sm">Keep your booked vendors organized.</p>
            </div>
          </div>
          
          <Link to="/plan">
            <Button variant="outline" className="rounded-full mt-8 font-bold px-8 py-6">Explore Planning Tools</Button>
          </Link>
        </div>
      </section>

      {/* 10. Vendor CTA */}
      <section className="border-y border-border-soft bg-lavender-light py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Do you provide event products or services?</h2>
          <p className="text-lg text-gray-700 mb-8">Join the Merry Tales marketplace to reach new customers, showcase your work, and grow your business.</p>
          <Link to="/vendor/join">
            <Button className="rounded-full font-bold shadow-soft px-8 py-6 bg-white text-foreground hover:bg-gray-50">Join as a Vendor</Button>
          </Link>
        </div>
      </section>

      {/* Partner ecosystem entry point */}
      <section data-cursor-focus className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid items-center gap-10 rounded-[2.5rem] border border-border-soft bg-[#fffafc] p-7 shadow-soft md:p-12 lg:grid-cols-[1fr_1.1fr]"><div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Plug/></div><p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-primary">The partner ecosystem</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Many specialists. One trusted event journey.</h2><p className="mt-5 leading-7 text-gray-600">We are opening Merry Tales to voucher issuers, banks, payment providers, M-Pesa rails, messaging, logistics and corporate benefit partners—with clear responsibilities and verified integrations.</p><Link to="/partners"><Button variant="outline" className="mt-7 rounded-full px-8 py-6 font-bold">Explore partnerships <ArrowRight className="ml-2 h-4 w-4"/></Button></Link></div><div className="grid grid-cols-2 gap-4">{[{icon:Gift,label:'Gifting & vouchers'},{icon:Building2,label:'Banks & enterprise'},{icon:ShoppingBag,label:'Payments & commerce'},{icon:Users,label:'Messaging & fulfilment'}].map(({icon:Icon,label})=><div key={label} className="rounded-3xl border bg-white p-5"><Icon className="h-6 w-6 text-primary"/><p className="mt-4 font-extrabold">{label}</p><p className="mt-1 text-xs text-gray-500">Integration opportunity</p></div>)}</div></div></div>
      </section>

      {/* 11. Final CTA */}
      <section data-cursor-focus="light" className="relative overflow-hidden bg-primary py-20 text-white md:py-32">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <span className="text-5xl mb-6 block">✨</span>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-8">READY TO MAKE IT YOURS?</h2>
          <Link to="/create">
            <Button className="rounded-full px-12 py-8 text-xl font-bold shadow-soft bg-white text-primary hover:bg-gray-100 border-none">
              START PLANNING &rarr;
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
