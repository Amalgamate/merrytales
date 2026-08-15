import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Copy,
  Loader2,
  MapPin,
  PackageOpen,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchVendor,
  formatResponseTime,
  submitLead,
  toProductCard,
  vendorImage,
  type ApiVendor,
} from "@/lib/marketplace";
import { ProductCard } from "@/components/merry/ProductCard";

type ShopSection = "shop" | "services" | "reviews";

export function VendorProfile() {
  const { slug } = useParams();
  const [vendor, setVendor] = useState<ApiVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [section, setSection] = useState<ShopSection>("shop");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [quoteForm, setQuoteForm] = useState({
    name: "",
    phone: "",
    email: "",
    eventDate: "",
    message: "",
  });

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchVendor(slug)
      .then(setVendor)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Shop not found."),
      )
      .finally(() => setLoading(false));
  }, [slug]);

  const sendQuote = async () => {
    if (!vendor) return;
    setQuoteBusy(true);
    setNotice("");
    try {
      await submitLead({
        vendorId: vendor.id,
        name: quoteForm.name,
        phone: quoteForm.phone || undefined,
        email: quoteForm.email || undefined,
        eventDate: quoteForm.eventDate
          ? new Date(`${quoteForm.eventDate}T09:00:00`).toISOString()
          : undefined,
        message:
          quoteForm.message || `Quote request for ${vendor.businessName}.`,
      });
      setNotice(
        "Your request is with the shop. They will respond through Merry Tales.",
      );
      setQuoteOpen(false);
      setQuoteForm({
        name: "",
        phone: "",
        email: "",
        eventDate: "",
        message: "",
      });
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "Unable to send your request.",
      );
    } finally {
      setQuoteBusy(false);
    }
  };

  const shareShop = async () => {
    if (!vendor) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: vendor.businessName,
          text: `Discover ${vendor.businessName} on Merry Tales`,
          url,
        });
        return;
      }
      await navigator.clipboard?.writeText(url);
      setNotice("Shop link copied — ready to share.");
    } catch {
      // Share cancellation is not an error a customer needs to see.
    }
  };

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#fbfafc] pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!vendor || error)
    return (
      <div className="grid min-h-screen place-items-center bg-[#fbfafc] px-5 pt-20 text-center">
        <div>
          <Store className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-5 text-3xl font-black">
            {error || "Shop not found"}
          </h1>
          <p className="mt-2 text-gray-500">
            This shop may be unavailable or its link may have changed.
          </p>
          <Link to="/vendors">
            <Button className="mt-6 rounded-xl">Explore vendors</Button>
          </Link>
        </div>
      </div>
    );

  const image = vendorImage(vendor.category);
  const responseTime = formatResponseTime(vendor.responseMinutes);
  const whatsappUrl = vendor.whatsapp
    ? `https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}`
    : undefined;
  const initials = vendor.businessName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const products = vendor.products ?? [];
  const services = vendor.services ?? [];
  const shopSummary =
    vendor.description ??
    `${vendor.businessName} is a Merry Tales shop for ${vendor.category.toLowerCase()} in ${vendor.city}. Explore their offers and request a tailored quote for your event.`;
  const tabs: { id: ShopSection; label: string; count?: number }[] = [
    { id: "shop", label: "Shop", count: products.length },
    { id: "services", label: "Services", count: services.length },
    { id: "reviews", label: "Reviews", count: vendor.reviewCount },
  ];
  const startingPrice = vendor.startingPrice
    ? `KES ${Number(vendor.startingPrice).toLocaleString()}`
    : "Ask for a quote";
  const ratingText = vendor.reviewCount
    ? `${Number(vendor.rating).toFixed(1)} (${vendor.reviewCount})`
    : "New on Merry Tales";

  return (
    <main className="min-h-screen bg-[#fbfafc] pb-28 text-[#20203d] md:pb-12">
      <header className="sticky top-0 z-40 border-b border-white/15 bg-[#191834]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/vendors"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-white/80 transition hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" /> All vendors
          </Link>
          <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-white/55 sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Merry Tales shop
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void shareShop()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#191834]">
        <div className="absolute inset-0 opacity-45">
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(24,23,53,.98)_10%,rgba(24,23,53,.78)_50%,rgba(24,23,53,.36)_100%)]" />
        <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full bg-primary/35 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 md:pb-28 md:pt-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-white/85">
              <BadgeCheck className="h-4 w-4 text-[#8de0b7]" /> Verified Merry
              Tales shop
            </div>
            <p className="text-sm font-bold text-primary">{vendor.category}</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
              {vendor.businessName}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              {shopSummary}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                onClick={() => setQuoteOpen(true)}
                className="h-12 rounded-xl px-5 text-sm font-extrabold shadow-xl shadow-black/20"
              >
                Plan with this shop <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl border-white/30 bg-white/10 px-5 text-sm font-extrabold text-white hover:bg-white hover:text-[#20203d]"
                  >
                    <FaWhatsapp className="mr-2 h-4 w-4" /> WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="relative -mt-10 grid gap-4 rounded-2xl border border-white/80 bg-white p-4 shadow-[0_18px_45px_rgba(25,24,52,.12)] sm:grid-cols-[auto_1fr] sm:items-center sm:p-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-[linear-gradient(135deg,#f6d4e6,#fff)] text-xl font-black text-primary shadow-md sm:h-20 sm:w-20">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="font-extrabold">{vendor.city}, Kenya</p>
              <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block" />
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-600">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {ratingText}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-600">
                <Clock3 className="h-4 w-4 text-primary" />
                {responseTime}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Independent business · Secure enquiries through Merry Tales
            </p>
          </div>
        </section>

        {notice && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700"
          >
            {notice}
          </p>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <nav
              aria-label="Shop sections"
              className="sticky top-16 z-30 -mx-4 mb-7 overflow-x-auto border-y border-[#ecebf2] bg-[#fbfafc]/95 px-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-2"
            >
              <div className="flex min-w-max gap-1">
                {tabs.map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setSection(tab.id)}
                    className={`relative px-4 py-3.5 text-sm font-extrabold transition ${section === tab.id ? "text-primary" : "text-gray-500 hover:text-[#20203d]"}`}
                  >
                    {tab.label}
                    <span className="ml-1.5 text-xs text-gray-400">
                      {tab.count}
                    </span>
                    {section === tab.id && (
                      <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </nav>

            {section === "shop" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <section className="rounded-2xl border border-[#e8e7ef] bg-white p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">
                        The shop story
                      </p>
                      <h2 className="mt-2 text-2xl font-black">
                        Made for memorable celebrations.
                      </h2>
                    </div>
                    <ShieldCheck className="h-6 w-6 shrink-0 text-green-600" />
                  </div>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600">
                    {shopSummary}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#f7f6fb] px-3 py-1.5 text-xs font-bold text-[#4a4965]">
                      {vendor.category}
                    </span>
                    <span className="rounded-full bg-[#f7f6fb] px-3 py-1.5 text-xs font-bold text-[#4a4965]">
                      Based in {vendor.city}
                    </span>
                    <span className="rounded-full bg-[#f7f6fb] px-3 py-1.5 text-xs font-bold text-[#4a4965]">
                      Secure enquiry
                    </span>
                  </div>
                </section>
                <section>
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">
                        Featured catalogue
                      </p>
                      <h2 className="mt-1 text-2xl font-black">
                        Shop their offers
                      </h2>
                    </div>
                    {products.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setSection("shop")}
                        className="text-sm font-extrabold text-primary"
                      >
                        View all {products.length} offers
                      </button>
                    )}
                  </div>
                  {products.length ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {products.map((item) => (
                        <ProductCard key={item.id} {...toProductCard(item)} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#d9d7e4] bg-white p-8 text-center">
                      <PackageOpen className="mx-auto h-8 w-8 text-primary" />
                      <h3 className="mt-3 font-extrabold">
                        A tailored catalogue is coming
                      </h3>
                      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                        Contact this shop with your event brief to receive
                        options and a custom proposal.
                      </p>
                      <Button
                        onClick={() => setQuoteOpen(true)}
                        variant="outline"
                        className="mt-5 rounded-xl"
                      >
                        Request a proposal
                      </Button>
                    </div>
                  )}
                </section>
              </div>
            )}

            {section === "services" && (
              <section className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">
                    Plan with confidence
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Services & packages
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Choose a starting point, then personalise it with the shop.
                  </p>
                </div>
                {services.length ? (
                  services.map((service) => (
                    <article
                      key={service.id}
                      className="rounded-2xl border border-[#e8e7ef] bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row">
                        <div>
                          <h3 className="text-lg font-extrabold">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-xs font-bold uppercase tracking-[.12em] text-gray-400">
                            From
                          </p>
                          <p className="mt-1 text-xl font-black text-primary">
                            {service.price != null
                              ? `KES ${Number(service.price).toLocaleString()}`
                              : "On request"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setQuoteForm((current) => ({
                            ...current,
                            message: `I'm interested in ${service.name}.`,
                          }));
                          setQuoteOpen(true);
                        }}
                        className="mt-5 rounded-xl"
                      >
                        Ask about this service{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-gray-500">
                    This shop will tailor a package to your event. Send a brief
                    to get started.
                  </div>
                )}
              </section>
            )}

            {section === "reviews" && (
              <section className="animate-in fade-in duration-200">
                <div className="rounded-2xl bg-[#20203d] p-6 text-white sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">
                    Customer love
                  </p>
                  <div className="mt-3 flex items-end gap-4">
                    <p className="text-5xl font-black">
                      {Number(vendor.rating).toFixed(1)}
                    </p>
                    <div className="pb-1">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Star key={value} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-white/65">
                        From {vendor.reviewCount} Merry Tales reviews
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {vendor.reviews?.length ? (
                    vendor.reviews.map((review) => (
                      <article
                        key={review.id}
                        className="rounded-2xl border border-[#e8e7ef] bg-white p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-extrabold">
                              {review.authorName}
                            </p>
                            <div className="mt-1 flex text-amber-400">
                              {Array.from(
                                { length: review.rating },
                                (_, index) => (
                                  <Star
                                    key={index}
                                    className="h-3.5 w-3.5 fill-current"
                                  />
                                ),
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString(
                              "en-KE",
                              { month: "short", year: "numeric" },
                            )}
                          </span>
                        </div>
                        {review.body && (
                          <p className="mt-4 text-sm leading-6 text-gray-600">
                            “{review.body}”
                          </p>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-gray-500">
                      Customer reviews will appear here as this shop completes
                      events through Merry Tales.
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28 overflow-hidden rounded-2xl border border-[#e8e7ef] bg-white shadow-[0_16px_42px_rgba(25,24,52,.08)]">
              <div className="bg-[linear-gradient(135deg,#fff3f8,#f6f1ff)] p-6">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">
                  Start planning
                </p>
                <h2 className="mt-2 text-xl font-black">
                  Bring your event idea to life.
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Tell {vendor.businessName} what you have in mind and receive a
                  tailored response.
                </p>
              </div>
              <div className="space-y-5 p-6">
                <div className="flex items-end justify-between border-b border-[#eeeef3] pb-5">
                  <span className="text-sm text-gray-500">Starting from</span>
                  <strong className="text-xl font-black">
                    {startingPrice}
                  </strong>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> Verified
                    shop
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <Clock3 className="h-4 w-4 text-primary" /> {responseTime}
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-primary" /> {vendor.city}
                  </p>
                </div>
                <Button
                  onClick={() => setQuoteOpen(true)}
                  className="h-12 w-full rounded-xl font-extrabold"
                >
                  Request a proposal
                </Button>
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <Button
                      variant="outline"
                      className="mt-3 h-11 w-full rounded-xl border-green-200 font-extrabold text-green-700 hover:bg-green-50"
                    >
                      <FaWhatsapp className="mr-2 h-4 w-4" /> Chat on WhatsApp
                    </Button>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => void shareShop()}
                  className="mt-1 flex w-full items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-primary"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy or share shop link
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e7ef] bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button
            onClick={() => setQuoteOpen(true)}
            className="h-12 flex-1 rounded-xl font-extrabold"
          >
            Request proposal
          </Button>
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl border-green-200 bg-green-50 text-green-700"
              >
                <FaWhatsapp className="h-5 w-5" />
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => void shareShop()}
            className="h-12 w-12 rounded-xl"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {quoteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#17162d]/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-title"
            className="w-full max-w-xl rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">
                  A better brief, a better quote
                </p>
                <h2 id="quote-title" className="mt-1 text-2xl font-black">
                  Plan with {vendor.businessName}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Share the essentials. The shop receives this in their Merry
                  Tales workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Your name"
                value={quoteForm.name}
                onChange={(event) =>
                  setQuoteForm({ ...quoteForm, name: event.target.value })
                }
                className="h-11 rounded-xl"
              />
              <Input
                placeholder="Phone / WhatsApp"
                value={quoteForm.phone}
                onChange={(event) =>
                  setQuoteForm({ ...quoteForm, phone: event.target.value })
                }
                className="h-11 rounded-xl"
              />
              <Input
                placeholder="Email (optional)"
                value={quoteForm.email}
                onChange={(event) =>
                  setQuoteForm({ ...quoteForm, email: event.target.value })
                }
                className="h-11 rounded-xl"
              />
              <Input
                type="date"
                aria-label="Event date"
                value={quoteForm.eventDate}
                onChange={(event) =>
                  setQuoteForm({ ...quoteForm, eventDate: event.target.value })
                }
                className="h-11 rounded-xl"
              />
            </div>
            <textarea
              value={quoteForm.message}
              onChange={(event) =>
                setQuoteForm({ ...quoteForm, message: event.target.value })
              }
              placeholder="What are you planning? Include your celebration type, guests, style and budget if you know them."
              className="mt-3 min-h-28 w-full rounded-xl border border-input p-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setQuoteOpen(false)}
                className="rounded-xl"
              >
                Not now
              </Button>
              <Button
                disabled={quoteBusy || !quoteForm.name || !quoteForm.phone}
                onClick={() => void sendQuote()}
                className="h-11 rounded-xl px-5 font-extrabold"
              >
                {quoteBusy ? "Sending request…" : "Send my request"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
