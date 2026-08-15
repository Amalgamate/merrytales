import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, ChevronLeft, Clock, Heart, Loader2, MapPin, Share, Star } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchVendor, formatResponseTime, submitLead, toProductCard, vendorImage, type ApiVendor } from '@/lib/marketplace';
import { ProductCard } from '@/components/merry/ProductCard';

export function VendorProfile() {
  const { slug } = useParams();
  const [vendor, setVendor] = useState<ApiVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [quoteNotice, setQuoteNotice] = useState('');
  const [quoteForm, setQuoteForm] = useState({ name: '', phone: '', email: '', eventDate: '', message: '' });

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchVendor(slug)
      .then(setVendor)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Vendor not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const sendQuote = async () => {
    if (!vendor) return;
    setQuoteBusy(true);
    setQuoteNotice('');
    try {
      await submitLead({
        vendorId: vendor.id,
        name: quoteForm.name,
        phone: quoteForm.phone || undefined,
        email: quoteForm.email || undefined,
        eventDate: quoteForm.eventDate ? new Date(`${quoteForm.eventDate}T09:00:00`).toISOString() : undefined,
        message: quoteForm.message || `Quote request for ${vendor.businessName}.`,
      });
      setQuoteNotice('Request sent. The vendor will respond through Merry Tales.');
      setQuoteOpen(false);
    } catch (cause) {
      setQuoteNotice(cause instanceof Error ? cause.message : 'Unable to send request.');
    } finally {
      setQuoteBusy(false);
    }
  };

  if (loading) return <div className="grid min-h-screen place-items-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!vendor || error) return (
    <div className="pt-32 text-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">{error || 'Vendor Not Found'}</h1>
      <Link to="/vendors"><Button className="rounded-full">Back to Vendors</Button></Link>
    </div>
  );

  const image = vendorImage(vendor.category);
  const responseTime = formatResponseTime(vendor.responseMinutes);
  const whatsappUrl = vendor.whatsapp ? `https://wa.me/${vendor.whatsapp.replace(/\D/g, '')}` : undefined;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="md:hidden fixed top-0 w-full z-40 bg-white/80 backdrop-blur border-b border-border-soft px-4 h-14 flex items-center justify-between">
        <Link to="/vendors" className="flex items-center text-foreground font-semibold"><ChevronLeft className="h-5 w-5 mr-1" /> Back</Link>
        <div className="flex space-x-3"><button className="text-gray-500 hover:text-primary"><Share className="h-5 w-5" /></button><button className="text-gray-500 hover:text-primary"><Heart className="h-5 w-5" /></button></div>
      </div>

      <div className="h-64 md:h-[400px] w-full relative pt-14 md:pt-20">
        <img src={image} alt={vendor.businessName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-24 z-10 mb-8">
        <div className="bg-white rounded-3xl shadow-soft p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end gap-6 border border-border-soft">
          <img src={image} alt={`${vendor.businessName} logo`} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl shadow-md object-cover border-4 border-white bg-white" />
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start w-full gap-4">
              <div>
                <p className="text-primary font-bold text-sm uppercase tracking-wider mb-1">{vendor.category}</p>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">{vendor.businessName}</h1>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center"><Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" /> <strong className="text-foreground mr-1">{Number(vendor.rating).toFixed(1)}</strong> ({vendor.reviewCount} reviews)</span>
                  <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {vendor.city}</span>
                  <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {responseTime}</span>
                </div>
              </div>
              <div className="hidden md:flex flex-col gap-2 min-w-[200px]">
                <Button className="w-full rounded-full font-bold" onClick={() => setQuoteOpen(true)}>Request Quote</Button>
                {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full rounded-full border-green-200 text-green-700 hover:bg-green-50 font-bold"><FaWhatsapp className="mr-2 h-4 w-4" /> WhatsApp</Button></a>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-border-soft rounded-none h-auto p-0 mb-6 flex-wrap">
                <TabsTrigger value="about" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-base">About</TabsTrigger>
                <TabsTrigger value="listings" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-base">Listings</TabsTrigger>
                <TabsTrigger value="packages" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-base">Services</TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-base">Reviews ({vendor.reviewCount})</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3">About {vendor.businessName}</h3>
                  <p className="text-gray-600 leading-relaxed">{vendor.description ?? `${vendor.businessName} is a verified Merry Tales provider for ${vendor.category.toLowerCase()} in ${vendor.city}.`}</p>
                </div>
              </TabsContent>

              <TabsContent value="listings" className="space-y-4">
                {vendor.products?.length ? <div className="grid sm:grid-cols-2 gap-4">{vendor.products.map((item) => <ProductCard key={item.id} {...toProductCard(item)} />)}</div> : <p className="text-gray-500">No approved listings yet.</p>}
              </TabsContent>

              <TabsContent value="packages" className="space-y-6">
                {vendor.services?.length ? vendor.services.map((service) => (
                  <div key={service.id} className="border border-border-soft rounded-2xl p-6 bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div><h3 className="text-lg font-bold">{service.name}</h3>{service.description && <p className="text-sm text-gray-500 mt-1">{service.description}</p>}</div>
                      {service.price != null && <div className="text-xl font-bold text-primary whitespace-nowrap">KES {Number(service.price).toLocaleString()}</div>}
                    </div>
                    <Button className="w-full rounded-full" variant="outline" onClick={() => { setQuoteForm((current) => ({ ...current, message: `I'm interested in ${service.name}.` })); setQuoteOpen(true); }}>Request this service</Button>
                  </div>
                )) : <p className="text-gray-500">Services will appear here once added.</p>}
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-6">
                  <div className="flex items-center mb-6">
                    <div className="text-4xl font-bold mr-4">{Number(vendor.rating).toFixed(1)}</div>
                    <div><div className="flex text-yellow-400 mb-1">{[1, 2, 3, 4, 5].map((value) => <Star key={value} className="h-4 w-4 fill-yellow-400" />)}</div><p className="text-sm text-gray-500">Based on {vendor.reviewCount} reviews</p></div>
                  </div>
                  {vendor.reviews?.length ? vendor.reviews.map((review) => (
                    <div key={review.id} className="border-b border-border-soft pb-6">
                      <div className="flex justify-between mb-2"><h4 className="font-bold">{review.authorName}</h4><span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString('en-KE')}</span></div>
                      <div className="flex text-yellow-400 mb-3">{Array.from({ length: review.rating }, (_, index) => <Star key={index} className="h-3 w-3 fill-yellow-400" />)}</div>
                      {review.body && <p className="text-gray-600 text-sm leading-relaxed">{review.body}</p>}
                    </div>
                  )) : <p className="text-gray-500">No reviews yet.</p>}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="hidden md:block">
            <div className="sticky top-28 bg-white border border-border-soft rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Pricing</h3>
              <div className="flex justify-between items-end mb-6 pb-6 border-b border-border-soft">
                <span className="text-gray-500">Starting from</span>
                <span className="text-2xl font-bold">KES {Number(vendor.startingPrice ?? 0).toLocaleString()}</span>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm"><span className="text-gray-500 flex items-center"><Clock className="h-4 w-4 mr-2" /> Response</span><span className="font-medium">{responseTime}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500 flex items-center"><MapPin className="h-4 w-4 mr-2" /> Base</span><span className="font-medium">{vendor.city}</span></div>
              </div>
              <Button className="w-full rounded-full font-bold py-6 mb-3" onClick={() => setQuoteOpen(true)}>Request Quote</Button>
              {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full rounded-full border-green-200 text-green-700 hover:bg-green-50 font-bold py-6"><FaWhatsapp className="mr-2 h-5 w-5" /> Chat on WhatsApp</Button></a>}
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-border-soft p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40 flex gap-3">
        <Button className="flex-1 rounded-full font-bold shadow-soft" onClick={() => setQuoteOpen(true)}>Request Quote</Button>
        {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer"><Button variant="outline" size="icon" className="rounded-full w-12 h-12 shrink-0 border-green-200 text-green-600 bg-green-50"><FaWhatsapp className="h-6 w-6" /></Button></a>}
      </div>

      {quoteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black">Request a quote from {vendor.businessName}</h2>
            <p className="mt-2 text-sm text-gray-500">Share your event details. The vendor receives this as a lead in their Merry Tales workspace.</p>
            <div className="mt-5 space-y-3">
              <Input placeholder="Your name" value={quoteForm.name} onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })} />
              <Input placeholder="Phone / WhatsApp" value={quoteForm.phone} onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })} />
              <Input placeholder="Email (optional)" value={quoteForm.email} onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })} />
              <Input type="date" value={quoteForm.eventDate} onChange={(e) => setQuoteForm({ ...quoteForm, eventDate: e.target.value })} />
              <textarea value={quoteForm.message} onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })} placeholder="Tell the vendor what you need…" className="min-h-24 w-full rounded-xl border p-3 text-sm" />
            </div>
            {quoteNotice && <p className="mt-3 text-sm text-primary">{quoteNotice}</p>}
            <div className="mt-5 flex gap-3"><Button variant="outline" className="rounded-full" onClick={() => setQuoteOpen(false)}>Cancel</Button><Button disabled={quoteBusy || !quoteForm.name || !quoteForm.phone} onClick={() => void sendQuote()} className="flex-1 rounded-full">{quoteBusy ? 'Sending…' : 'Send request'}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
