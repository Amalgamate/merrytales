import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const popular = [
  "Weddings",
  "Catering",
  "Photography",
  "Decor",
  "Venues",
  "Invitations",
];
const suggestions = [
  "Wedding decor",
  "Wedding venues",
  "Event photographer",
  "Catering",
  "Birthday cakes",
  "Invitations",
  "Luxury car hire",
  "Event MC",
];

const heroSlides = [
  {
    eyebrow: "Your whole event, one calm place",
    title: "Plan it your way.",
    accent: "Bring it beautifully to life.",
    copy: "Build a budget, discover trusted vendors and keep every decision, payment and detail together.",
    image: "/Hero/Plan-it.png",
    alt: "A Kenyan couple and event planner coordinating an elegant outdoor celebration",
    label: "PLAN",
    cta: "Start planning",
    href: "/plan",
    chips: ["Budget", "Guest list", "Trusted vendors"],
  },
  {
    eyebrow: "Gift Pesa & unforgettable experiences",
    title: "Give more than a gift.",
    accent: "Give them a story.",
    copy: "Send Gift Pesa, contribute as a group, or choose flights, adventures and thoughtful experiences for someone you love.",
    image: "/Hero/give-more.png",
    alt: "A joyful Kenyan family sharing a premium celebration gift",
    label: "GIFT",
    cta: "Explore gifting",
    href: "/gifts",
    chips: [
      "Gift Pesa",
      "Flights",
      "Adventures",
      "Hotpoint + DStv voucher ideas",
    ],
  },
  {
    eyebrow: "From the diaspora, with love",
    title: "Be there, even from afar.",
    accent: "Every coin accounted for.",
    copy: "Plan Cucu’s celebration, fund a loved one’s event and follow the budget from your own currency to the final moment.",
    image: "/Hero/Be-There.png",
    alt: "A Kenyan grandmother celebrating with family while relatives join from abroad",
    label: "DIASPORA",
    cta: "Plan for family",
    href: "/plan",
    chips: ["Multi-currency ready", "M-PESA", "Visa"],
  },
  {
    eyebrow: "Built for vendors & corporate teams",
    title: "Run remarkable events.",
    accent: "Grow serious business.",
    copy: "Onboard services, respond to briefs and manage corporate events, client gifting, quotes and delivery from one workspace.",
    image: "/Hero/Remarkable-events.png",
    alt: "A Kenyan event production team coordinating a premium corporate gala",
    label: "BUSINESS",
    cta: "Join as a vendor",
    href: "/vendor/join",
    chips: ["Quotes", "Corporate gifting", "Delivery"],
  },
];

function HeroHeading({ slide }: { slide: (typeof heroSlides)[number] }) {
  const headingClass =
    "max-w-[680px] text-balance font-display font-medium leading-[.92] tracking-[-.035em] text-[#101936]";

  if (slide.label === "DIASPORA") {
    return (
      <h1
        className={headingClass}
        style={{ fontSize: "clamp(2.9rem, 5vw, 5.25rem)" }}
      >
        <span className="block">Be there,</span>
        <span className="block">
          <em className="not-italic text-[#ec3d83]">even</em> from afar.
        </span>
      </h1>
    );
  }

  return (
    <h1
      className={headingClass}
      style={{ fontSize: "clamp(2.8rem, 4.5vw, 5rem)" }}
    >
      <span className="block">{slide.title}</span>
      <span className="mt-1 block text-[#ec3d83]">{slide.accent}</span>
    </h1>
  );
}

function HeroCopy({ slide }: { slide: (typeof heroSlides)[number] }) {
  if (slide.label === "DIASPORA") {
    return (
      <p className="mt-5 max-w-[540px] font-sans text-[16px] font-normal leading-[1.6] text-[#151827] sm:text-[18px]">
        Plan Cucu’s celebration,{" "}
        <span className="font-medium text-[#ec3d83]">fund</span> a loved one’s
        event, and <span className="font-medium text-[#ec3d83]">follow</span>{" "}
        the budget from your own currency to the moment that matters.
      </p>
    );
  }

  return (
    <p className="mt-5 max-w-[540px] font-sans text-[16px] font-normal leading-[1.6] text-[#151827] sm:text-[18px]">
      {slide.copy}
    </p>
  );
}

export function MarketplaceSearchHero() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const floralOverlayRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
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
    window.addEventListener("wheel", detectScroll, {
      passive: true,
      capture: true,
    });
    window.addEventListener("scroll", detectScroll, { passive: true });
    scheduleAdvance();

    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener("wheel", detectScroll, { capture: true });
      window.removeEventListener("scroll", detectScroll);
    };
  }, [activeSlide]);

  useEffect(() => {
    let frame: number | undefined;

    const moveFloralOverlay = () => {
      frame = undefined;
      const hero = heroRef.current;
      const flowers = floralOverlayRef.current;
      if (!hero || !flowers) return;

      const viewportHeight = window.innerHeight || 1;
      const progress = Math.max(
        -1,
        Math.min(1, hero.getBoundingClientRect().top / viewportHeight),
      );
      flowers.style.setProperty("--hero-floral-scroll", `${progress * -22}px`);
    };

    const requestMotionUpdate = () => {
      if (frame === undefined) frame = window.requestAnimationFrame(moveFloralOverlay);
    };

    moveFloralOverlay();
    window.addEventListener("scroll", requestMotionUpdate, { passive: true });
    window.addEventListener("resize", requestMotionUpdate);

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestMotionUpdate);
      window.removeEventListener("resize", requestMotionUpdate);
    };
  }, []);

  const filtered = query.trim()
    ? suggestions
        .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
    : suggestions.slice(0, 5);

  const search = (event?: FormEvent, suggestedQuery?: string) => {
    event?.preventDefault();
    const params = new URLSearchParams();
    const finalQuery = suggestedQuery ?? query;
    if (finalQuery.trim()) params.set("q", finalQuery.trim());
    if (city.trim()) params.set("city", city.trim());
    if (date) params.set("date", date);
    navigate(`/shop${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <section
      ref={heroRef}
      className="relative isolate z-20 overflow-hidden bg-[#fff9f4] pb-10 text-[#101936] sm:pb-12"
    >
      <div className="relative w-full">
        <div className="relative grid overflow-hidden lg:h-[min(700px,calc(100svh-120px))] lg:grid-cols-[.82fr_1.18fr] lg:items-stretch">
          <div className="relative z-10 flex min-h-[490px] items-center px-4 py-14 sm:min-h-[530px] sm:px-6 sm:py-[4.5rem] lg:min-h-0 lg:px-12 lg:py-20 xl:pl-[7vw]">
            <div className="w-full max-w-[600px] text-left">
              <div
                key={slide.title}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                <p className="mb-6 inline-flex items-center rounded-full border border-[#ec3d83]/15 bg-white/75 px-3 py-1.5 font-sans text-xs font-semibold tracking-[.01em] text-[#9e285b] shadow-sm backdrop-blur-sm">
                  {slide.label === "DIASPORA"
                    ? "✦ Your moments, beautifully told"
                    : `✦ ${slide.eyebrow}`}
                </p>
                <HeroHeading slide={slide} />
                <HeroCopy slide={slide} />
                {slide.label === "DIASPORA" && (
                  <div className="mt-6 flex max-w-[560px] flex-wrap justify-start gap-x-6 gap-y-2 font-sans text-[13px] font-medium text-[#101936] sm:text-sm">
                    <span>
                      <b className="mr-1.5 font-medium text-[#ec3d83]">✦</b>Stay
                      connected
                    </span>
                    <span>
                      <b className="mr-1.5 font-medium text-[#ec3d83]">✦</b>
                      Contribute with love
                    </span>
                    <span>
                      <b className="mr-1.5 font-medium text-[#ec3d83]">✦</b>
                      Celebrate together
                    </span>
                  </div>
                )}
              </div>
              <div
                className="mt-5 flex items-center justify-start gap-2"
                role="tablist"
                aria-label="Merry Tales experiences"
              >
                {heroSlides.map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    role="tab"
                    aria-selected={activeSlide === index}
                    aria-label={`Show ${item.label.toLowerCase()} story`}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2 rounded-full transition-all ${activeSlide === index ? "w-10 bg-primary" : "w-2 bg-slate-300 hover:bg-slate-500"}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="relative min-h-[300px] overflow-hidden sm:min-h-[370px] lg:min-h-0">
            {heroSlides.map((item, index) => (
              <img
                key={item.image}
                src={item.image}
                alt={activeSlide === index ? item.alt : ""}
                aria-hidden={activeSlide !== index}
                className={`hero-fade-image absolute inset-0 h-full w-full object-cover object-[68%_center] ${activeSlide === index ? "is-active" : ""}`}
              />
            ))}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,249,244,.94)_0%,rgba(255,249,244,.48)_16%,rgba(255,249,244,0)_42%)] lg:block" />
          </div>
          <div
            ref={floralOverlayRef}
            aria-hidden="true"
            className="hero-floral-overlay pointer-events-none absolute inset-0 z-20"
          >
            <img
              src="/Hero/hero-bottom-flowers.png"
              alt=""
              className="h-full w-full object-cover object-bottom opacity-55"
            />
          </div>
        </div>

        <form
          onSubmit={search}
          className="hero-search relative z-30 mx-auto -mt-7 w-[calc(100%-2rem)] max-w-6xl rounded-[1.15rem] border border-slate-200 bg-white/95 p-1.5 text-[#10172a] shadow-[0_16px_36px_rgba(16,23,42,.14)] backdrop-blur-sm sm:-mt-10 sm:w-[calc(100%-3rem)] sm:rounded-[1.35rem] sm:p-2 lg:w-[calc(100%-4rem)]"
        >
          <div className="grid lg:grid-cols-[1.55fr_.9fr_.85fr_auto]">
            <label className="hero-field relative flex items-center gap-3 rounded-xl px-3 py-3 text-[#10172a] focus-within:bg-pink-50/50 focus-within:ring-2 focus-within:ring-primary/25 sm:px-4 lg:border-r lg:border-slate-200">
              <Search className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-black uppercase tracking-[.08em] text-[#303348] sm:text-[10px]">
                  What are you looking for?
                </span>
                <input
                  value={query}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() =>
                    window.setTimeout(() => setShowSuggestions(false), 120)
                  }
                  onChange={(e) => setQuery(e.target.value)}
                  className="mt-0.5 w-full bg-transparent text-sm font-medium text-[#10172a] outline-none placeholder:text-[#7b8497] placeholder:opacity-100"
                  placeholder="Decor, photographer or venue"
                />
              </span>
              {showSuggestions && filtered.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border bg-white py-2 text-[#10172a] shadow-xl">
                  {filtered.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={() => {
                        setQuery(item);
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-pink-50 hover:text-primary"
                    >
                      <Search className="h-3.5 w-3.5" />
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </label>
            <label className="hero-field flex items-center gap-3 rounded-xl px-3 py-3 text-[#10172a] focus-within:bg-pink-50/50 focus-within:ring-2 focus-within:ring-primary/25 sm:px-4 lg:border-r lg:border-slate-200">
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-black uppercase tracking-[.08em] text-[#303348] sm:text-[10px]">
                  Where?
                </span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-0.5 w-full bg-transparent text-sm font-medium text-[#10172a] outline-none placeholder:text-[#7b8497] placeholder:opacity-100"
                  placeholder="City or county"
                />
              </span>
            </label>
            <label className="hero-field flex items-center gap-3 rounded-xl px-3 py-3 text-[#10172a] focus-within:bg-pink-50/50 focus-within:ring-2 focus-within:ring-primary/25 sm:px-4">
              <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-black uppercase tracking-[.08em] text-[#303348] sm:text-[10px]">
                  When?
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-0.5 w-full bg-transparent text-sm font-medium text-[#10172a] outline-none [color-scheme:light]"
                />
              </span>
            </label>
            <button className="hero-search-button m-1 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-8 font-extrabold text-white shadow-[0_10px_25px_rgba(233,75,135,.3)] transition hover:-translate-y-0.5 hover:bg-[#d92f73] sm:min-h-12">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </form>

        <div className="hero-popular mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-start gap-2 overflow-x-auto pb-1 text-xs [scrollbar-width:none] sm:w-[calc(100%-3rem)] sm:justify-center lg:w-[calc(100%-4rem)]">
          <span className="shrink-0 font-extrabold text-slate-500">
            Popular:
          </span>
          {popular.map((item) => (
            <button
              key={item}
              onClick={() => {
                setQuery(item);
                search(undefined, item);
              }}
              className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 font-semibold text-[#10172a] shadow-sm backdrop-blur-md transition hover:border-primary/30 hover:bg-pink-50 hover:text-primary sm:px-4 sm:py-2"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
