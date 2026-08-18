import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Loader2, MapPin, Menu, Navigation, X, ShoppingCart, User, Heart, Search, MessageCircle } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { GlobalSearch } from '@/components/merry/GlobalSearch';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [panel, setPanel] = useState<'location' | 'notifications' | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState(() => localStorage.getItem('merry_tales_location_label') || 'Choose location');
  const [notices, setNotices] = useState<Array<{ id: string; title: string; body: string; readAt?: string | null; createdAt?: string }>>([]);
  const [unread, setUnread] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (locationLabel === 'Near me' || sessionStorage.getItem('merry_tales_location_prompt_seen')) return;
    const timer = window.setTimeout(() => {
      setPanel((current) => current ?? 'location');
      sessionStorage.setItem('merry_tales_location_prompt_seen', 'true');
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [locationLabel]);

  useEffect(() => {
    if (!user) {
      setNotices([{ id: 'welcome', title: 'Welcome to Merry Tales', body: 'Discover vendors, products and planning tools for every kind of event.', readAt: localStorage.getItem('merry_tales_welcome_read') }]);
      setUnread(localStorage.getItem('merry_tales_welcome_read') ? 0 : 1);
      return;
    }
    apiRequest<{ items: Array<{ id: string; title: string; body: string; readAt?: string | null; createdAt?: string }>; unread: number }>('/notifications').then((result) => { setNotices(result.items); setUnread(result.unread); }).catch(() => undefined);
  }, [user]);

  const detectLocation = () => {
    if (!navigator.geolocation) { setLocationLabel('Location unavailable'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      localStorage.setItem('merry_tales_location', JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }));
      localStorage.setItem('merry_tales_location_label', 'Near me');
      setLocationLabel('Near me'); setLocating(false); setPanel(null);
      navigate(`/shop?lat=${coords.latitude.toFixed(5)}&lng=${coords.longitude.toFixed(5)}`);
    }, () => { setLocationLabel('Permission needed'); setLocating(false); }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  };

  const readAll = async () => {
    if (user) await apiRequest('/notifications/read-all', { method: 'PATCH' }).catch(() => undefined);
    else localStorage.setItem('merry_tales_welcome_read', new Date().toISOString());
    setNotices((current) => current.map((item) => ({ ...item, readAt: new Date().toISOString() })));
    setUnread(0);
    setPanel(null);
  };

  const closeLocationPrompt = () => {
    sessionStorage.setItem('merry_tales_location_prompt_seen', 'true');
    setPanel(null);
  };

  const enableBrowserAlerts = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') new Notification('Merry Tales notifications are on', { body: 'We’ll alert you about important event and marketplace updates.' });
  };

  const openAssistant = () => window.dispatchEvent(new Event('merry-tales:open-assistant'));

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <nav className="fixed w-full z-50 bg-background/95 backdrop-blur-md border-b border-border-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="Merry Tales" className="h-14 md:h-16 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 justify-center px-8">
            <NavigationMenu>
              <NavigationMenuList>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={isActive('/discover') ? 'text-primary font-bold' : ''}>
                    Discover
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-4 p-6 md:w-[500px] lg:w-[680px] lg:grid-cols-12 bg-white rounded-3xl shadow-2xl border border-border-soft">
                      {/* Navigation Links Column */}
                      <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-extrabold mb-3 text-xs uppercase tracking-wider text-primary">Occasions</h4>
                          <ul className="space-y-2 text-sm">
                            <li><Link to="/stories/real-weddings" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Weddings</Link></li>
                            <li><Link to="/vendors?category=ruracio" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Ruracio & Traditional</Link></li>
                            <li><Link to="/stories" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Engagements</Link></li>
                            <li><Link to="/shop" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Baby Showers & Parties</Link></li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-extrabold mb-3 text-xs uppercase tracking-wider text-primary">Inspiration</h4>
                          <ul className="space-y-2 text-sm">
                            <li><Link to="/stories/real-weddings" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Real Weddings</Link></li>
                            <li><Link to="/stories" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Trending Styles</Link></li>
                            <li><Link to="/stories" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Wedding Ideas</Link></li>
                            <li><Link to="/plan" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Planning Guides</Link></li>
                          </ul>
                        </div>
                      </div>

                      {/* Visual Image Banner Card */}
                      <div className="lg:col-span-5 relative group rounded-2xl overflow-hidden shadow-soft border border-border-soft bg-muted min-h-[190px] flex flex-col justify-end p-4">
                        <img 
                          src="/african_stories_hero.png" 
                          alt="Real Weddings" 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                        <div className="relative z-10 text-white">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-primary px-2 py-0.5 rounded-full inline-block mb-1">
                            Featured Story
                          </span>
                          <h5 className="font-extrabold text-sm leading-tight text-white mb-1">Real Kenyan Weddings</h5>
                          <p className="text-[11px] text-white/80 line-clamp-1 mb-2">Wanjiku & Kamau's Vibrant Ruracio</p>
                          <Link to="/stories/real-weddings" className="text-xs font-bold text-primary-foreground hover:underline inline-flex items-center text-white">
                            Explore Stories &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className={isActive('/shop') ? 'text-primary font-bold' : ''}>
                    Shop
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-4 p-6 md:w-[600px] lg:w-[750px] lg:grid-cols-12 bg-white rounded-3xl shadow-2xl border border-border-soft">
                      {/* Categories Columns */}
                      <div className="lg:col-span-8 grid grid-cols-3 gap-3">
                        <div>
                          <h4 className="font-extrabold mb-3 text-xs uppercase tracking-wider text-primary">Digital</h4>
                          <ul className="space-y-2 text-xs">
                            <li><Link to="/shop/animated-story-tale" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Animated Invites</Link></li>
                            <li><Link to="/app/invitation" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">WhatsApp Invites</Link></li>
                            <li><Link to="/shop/memory-tale-website" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Wedding Websites</Link></li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-extrabold mb-3 text-xs uppercase tracking-wider text-primary">Print</h4>
                          <ul className="space-y-2 text-xs">
                            <li><Link to="/shop/invitation-suite-sage" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Wedding Invitations</Link></li>
                            <li><Link to="/shop/table-numbers-blush" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Table Numbers & Cards</Link></li>
                            <li><Link to="/shop/acrylic-welcome-sign" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Welcome Signs</Link></li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-extrabold mb-3 text-xs uppercase tracking-wider text-primary">Details</h4>
                          <ul className="space-y-2 text-xs">
                            <li><Link to="/shop/maji-labels-dusty-rose" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Water Bottle Labels</Link></li>
                            <li><Link to="/shop/event-branding-kit" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Logos & Branding</Link></li>
                            <li><Link to="/shop" className="text-primary font-bold hover:underline block pt-1">All Products &rarr;</Link></li>
                          </ul>
                        </div>
                      </div>

                      {/* Featured Product Image Card */}
                      <div className="lg:col-span-4 relative group rounded-2xl overflow-hidden shadow-soft border border-border-soft bg-lavender-light flex flex-col justify-between p-3.5">
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white mb-2 border border-border-soft flex items-center justify-center p-2">
                          <img 
                            src="/printable_water_labels.png" 
                            alt="Product Spotlight" 
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                          />
                          <span className="absolute top-2 left-2 text-[9px] font-extrabold bg-primary text-white px-2 py-0.5 rounded-full shadow-xs">
                            🔥 Bestseller
                          </span>
                        </div>
                        <div>
                          <h5 className="font-extrabold text-xs text-foreground line-clamp-1">Custom Maji Labels</h5>
                          <p className="text-[11px] text-primary font-extrabold">From KES 2,500</p>
                          <Link to="/shop/maji-labels-dusty-rose" className="text-[11px] font-bold text-foreground hover:text-primary flex items-center mt-1">
                            Shop Item &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className={isActive('/vendors') ? 'text-primary font-bold' : ''}>
                    Vendors
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-4 p-6 md:w-[500px] lg:w-[680px] lg:grid-cols-12 bg-white rounded-3xl shadow-2xl border border-border-soft">
                      {/* Vendor Links Column */}
                      <div className="lg:col-span-7 flex flex-col justify-between">
                        <div>
                          <h4 className="font-extrabold mb-3 text-xs uppercase tracking-wider text-primary">Find By Category</h4>
                          <ul className="space-y-2 text-sm">
                            <li><Link to="/vendors?category=photography" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Photography & Film</Link></li>
                            <li><Link to="/vendors?category=planners" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Wedding Planners</Link></li>
                            <li><Link to="/vendors?category=decorators" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Decorators & Florists</Link></li>
                            <li><Link to="/vendors?category=venues" className="text-foreground hover:text-primary font-medium transition-colors block py-0.5">Venues & Gardens</Link></li>
                          </ul>
                        </div>
                        <div className="pt-4 border-t border-border-soft mt-3">
                          <Link to="/vendors" className="text-primary font-extrabold text-xs hover:underline block mb-1">View All Verified Vendors &rarr;</Link>
                          <Link to="/vendor/join" className="text-[11px] text-gray-500 hover:text-foreground">Are you a vendor? Join the network.</Link>
                        </div>
                      </div>

                      {/* Featured Vendor Image Card */}
                      <div className="lg:col-span-5 relative group rounded-2xl overflow-hidden shadow-soft border border-border-soft bg-muted min-h-[190px] flex flex-col justify-end p-4">
                        <img 
                          src="/african_vendor_photography.png" 
                          alt="Vendor Spotlight" 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
                        <div className="relative z-10 text-white">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-yellow-500 text-black px-2 py-0.5 rounded-full inline-block mb-1">
                            ⭐ Top Rated
                          </span>
                          <h5 className="font-extrabold text-sm text-white mb-0.5">Mombasa Moments</h5>
                          <p className="text-[11px] text-white/80 mb-2">Replies in 1 hour • Verified</p>
                          <Link to="/vendors/mombasa-moments" className="text-xs font-bold text-white hover:text-primary transition-colors">
                            Book Vendor &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/gifts" className={`${navigationMenuTriggerStyle()} ${isActive('/gifts') ? 'text-primary font-bold' : ''}`}>
                    Gifts
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/stories" className={navigationMenuTriggerStyle()}>
                    Stories
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/plan" className={navigationMenuTriggerStyle()}>
                    Plan
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                </NavigationMenuItem>

              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {unread > 0 && <button onClick={() => setPanel(panel === 'notifications' ? null : 'notifications')} className="relative text-foreground hover:text-primary transition-colors" aria-label={`${unread} unread notifications`}><Bell className="h-5 w-5" /><span className="absolute -right-2 -top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-black text-white ring-2 ring-white">{unread > 9 ? '9+' : unread}</span></button>}
            <button onClick={() => setSearchOpen(true)} className="text-foreground hover:text-primary transition-colors" aria-label="Search MerryTales (Ctrl K)">
              <Search className="h-5 w-5" />
            </button>
            <Link to="/favorites" className="text-foreground hover:text-primary transition-colors">
              <Heart className="h-5 w-5" />
            </Link>
            {itemCount > 0 && <Link to="/cart" className="text-foreground hover:text-primary transition-colors relative">
              <ShoppingCart className="h-5 w-5" />
              <span aria-label={`${itemCount} items in cart`} className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-extrabold text-white ring-2 ring-white">{itemCount > 99 ? '99+' : itemCount}</span>
            </Link>}
            <Link to="/app" className="relative text-foreground hover:text-primary transition-colors">
              <User className="h-5 w-5" />
              {user && (
                <span
                  aria-label="Logged in"
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white"
                />
              )}
            </Link>
            <button
              onClick={openAssistant}
              aria-label="Open Merry assistant"
              className="grid h-11 w-11 place-items-center rounded-full border-2 border-primary bg-transparent text-primary transition hover:-translate-y-0.5 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <Link to="/create">
              <Button className="rounded-full px-6 font-semibold shadow-soft ml-2">
                Start Planning
              </Button>
            </Link>
          </div>

          {/* Mobile Actions (Top) */}
          <div className="lg:hidden flex items-center space-x-4">
            {unread > 0 && <button onClick={() => setPanel(panel === 'notifications' ? null : 'notifications')} className="relative text-foreground hover:text-primary transition-colors" aria-label={`${unread} unread notifications`}><Bell className="h-5 w-5" /><span className="absolute -right-2 -top-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white" /></button>}
             <button onClick={() => setSearchOpen(true)} className="text-foreground hover:text-primary transition-colors" aria-label="Search MerryTales">
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={openAssistant}
              aria-label="Open Merry assistant"
              className="grid h-10 w-10 place-items-center rounded-full border-2 border-primary bg-transparent text-primary transition hover:bg-primary/5"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            {itemCount > 0 && <Link to="/cart" className="text-foreground hover:text-primary transition-colors relative">
              <ShoppingCart className="h-5 w-5" />
              <span aria-label={`${itemCount} items in cart`} className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-extrabold text-white ring-2 ring-white">{itemCount > 99 ? '99+' : itemCount}</span>
            </Link>}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground focus:outline-none md:hidden"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {panel === 'location' && locationLabel !== 'Near me' && <div className="fixed left-1/2 top-[88px] z-[70] w-[min(330px,calc(100vw-28px))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 text-[#171735] shadow-[0_14px_38px_rgba(16,23,42,.14)] sm:top-24"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pink-50 text-primary"><MapPin className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-extrabold">Use your location?</h3><button onClick={closeLocationPrompt} aria-label="Close location prompt" className="-mr-1 -mt-1 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button></div><p className="mt-1 text-xs leading-5 text-slate-500">Show nearby vendors and services. You can skip this.</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={closeLocationPrompt} className="h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 transition hover:bg-slate-50">Not now</button><button onClick={detectLocation} disabled={locating} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white disabled:opacity-60">{locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}{locating ? 'Checking' : 'Allow'}</button></div>{locationLabel !== 'Choose location' && <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-slate-500"><MapPin className="h-3 w-3 text-primary" />{locationLabel}</p>}</div>}

      {panel === 'notifications' && unread > 0 && <div className="absolute right-4 top-[72px] z-[70] w-[min(390px,calc(100vw-32px))] overflow-hidden rounded-2xl border bg-white text-[#171735] shadow-2xl sm:right-6"><header className="flex items-center justify-between border-b p-4"><div><h3 className="font-extrabold">Notifications</h3><p className="text-[11px] text-slate-500">{`${unread} update${unread === 1 ? '' : 's'} unread`}</p></div><div className="flex items-center gap-3"><button onClick={() => void readAll()} className="text-xs font-bold text-primary">Mark all read</button><button onClick={() => setPanel(null)} aria-label="Close notifications"><X className="h-4 w-4" /></button></div></header><div className="max-h-80 divide-y overflow-y-auto">{notices.filter((item) => !item.readAt).map((item) => <article key={item.id} className="flex gap-3 bg-pink-50/60 p-4"><span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-white"><Bell className="h-4 w-4" /></span><div><h4 className="text-sm font-bold">{item.title}</h4><p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p></div></article>)}</div><footer className="border-t bg-slate-50 p-3"><button onClick={() => void enableBrowserAlerts()} className="w-full rounded-xl border bg-white px-4 py-2.5 text-xs font-bold hover:border-primary/30 hover:text-primary">Enable browser alerts</button></footer></div>}

      {/* Mobile Drawer (More menu) */}
      {isOpen && (
        <div className="md:hidden bg-background border-t border-border-soft absolute w-full left-0 shadow-soft h-screen overflow-y-auto pb-24">
          <div className="px-4 pt-4 pb-6 space-y-4">
            <Link to="/create" onClick={() => setIsOpen(false)}>
              <Button className="w-full rounded-full font-semibold mb-4">
                Start Planning &rarr;
              </Button>
            </Link>
            
            <div className="space-y-3">
              <h4 className="font-bold text-sm uppercase text-primary tracking-wider">Discover</h4>
              <Link to="/stories" className="block text-base font-semibold text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>Stories & Inspiration</Link>
              <Link to="/plan" className="block text-base font-semibold text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>Planning Center</Link>
              <Link to="/gifts" className="block text-base font-semibold text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>Gifts & Registries</Link>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-border-soft">
              <h4 className="font-bold text-sm uppercase text-primary tracking-wider">Shop & Vendors</h4>
              <Link to="/shop" className="block text-base font-semibold text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>Event Shop</Link>
              <Link to="/vendors" className="block text-base font-semibold text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>Find Vendors</Link>
            </div>
            
            <div className="pt-6 flex flex-col space-y-3">
              <a
                href="https://wa.me/254700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center text-green-600 hover:text-green-700 font-semibold border border-green-200 bg-green-50 rounded-full py-3"
              >
                <FaWhatsapp className="h-5 w-5 mr-2" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen}/>
    </nav>
  );
}
