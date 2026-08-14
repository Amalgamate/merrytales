import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Clock, CheckCircle, Heart, Share, ChevronLeft } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { vendors } from '@/data/vendors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function VendorProfile() {
  const { slug } = useParams();
  
  // Find vendor in seed data
  const vendor = vendors.find(v => v.slug === slug);
  
  if (!vendor) {
    return (
      <div className="pt-32 text-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Vendor Not Found</h1>
        <Link to="/vendors">
          <Button className="rounded-full">Back to Vendors</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Mobile Back Button */}
      <div className="md:hidden fixed top-0 w-full z-40 bg-white/80 backdrop-blur border-b border-border-soft px-4 h-14 flex items-center justify-between">
        <Link to="/vendors" className="flex items-center text-foreground font-semibold">
          <ChevronLeft className="h-5 w-5 mr-1" /> Back
        </Link>
        <div className="flex space-x-3">
          <button className="text-gray-500 hover:text-primary"><Share className="h-5 w-5" /></button>
          <button className="text-gray-500 hover:text-primary"><Heart className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="h-64 md:h-[400px] w-full relative pt-14 md:pt-20">
        <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      
      {/* Vendor Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-24 z-10 mb-8">
        <div className="bg-white rounded-3xl shadow-soft p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end gap-6 border border-border-soft">
          <img src={vendor.logo} alt={`${vendor.name} logo`} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl shadow-md object-cover border-4 border-white bg-white" />
          
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start w-full gap-4">
              <div>
                <p className="text-primary font-bold text-sm uppercase tracking-wider mb-1">{vendor.category}</p>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">{vendor.name}</h1>
                  {vendor.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center"><Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" /> <strong className="text-foreground mr-1">{vendor.rating}</strong> ({vendor.reviews} reviews)</span>
                  <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {vendor.location}</span>
                  <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {vendor.responseTime}</span>
                </div>
              </div>
              
              <div className="hidden md:flex flex-col gap-2 min-w-[200px]">
                <Button className="w-full rounded-full font-bold">Request Quote</Button>
                <Button variant="outline" className="w-full rounded-full border-green-200 text-green-700 hover:bg-green-50 font-bold">
                  <FaWhatsapp className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column - Tabs */}
          <div className="md:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-border-soft rounded-none h-auto p-0 mb-6 flex-wrap">
                <TabsTrigger value="about" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-base">About</TabsTrigger>
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-base">Portfolio</TabsTrigger>
                <TabsTrigger value="packages" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-base">Packages</TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-base">Reviews ({vendor.reviews})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3">About {vendor.name}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    We are a premier {vendor.category.toLowerCase()} service based in {vendor.location}, specializing in creating unforgettable moments for Kenyan weddings and events. With over 5 years of experience, our team brings creativity, professionalism, and local expertise to every celebration.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Our approach is personalized and dedicated to ensuring your vision comes to life exactly as you imagined it. We understand the nuances of both modern and traditional ceremonies like Ruracio and Nikah.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-3">Services Offered</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" /> Full Day Coverage</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" /> Pre-wedding Shoots</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" /> Drone Footage</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" /> Printed Albums</li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="portfolio">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-48 bg-muted rounded-2xl overflow-hidden"><img src={vendor.image} className="w-full h-full object-cover" alt="Portfolio 1" /></div>
                  <div className="h-48 bg-muted rounded-2xl overflow-hidden"><img src="/african_ruracio_story.png" className="w-full h-full object-cover" alt="Portfolio 2" /></div>
                  <div className="h-48 bg-muted rounded-2xl overflow-hidden"><img src="/african_garden_wedding.png" className="w-full h-full object-cover" alt="Portfolio 3" /></div>
                  <div className="h-48 bg-muted rounded-2xl overflow-hidden"><img src="/african_stories_hero.png" className="w-full h-full object-cover" alt="Portfolio 4" /></div>
                </div>
              </TabsContent>

              <TabsContent value="packages" className="space-y-6">
                 <div className="border border-border-soft rounded-2xl p-6 bg-white shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h3 className="text-lg font-bold">Standard Package</h3>
                       <p className="text-sm text-gray-500">Perfect for Ruracio or intimate weddings</p>
                     </div>
                     <div className="text-xl font-bold text-primary">KES 50,000</div>
                   </div>
                   <ul className="space-y-2 mb-6">
                     <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> 8 Hours Coverage</li>
                     <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> 300 Edited Photos</li>
                     <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Online Gallery</li>
                   </ul>
                   <Button className="w-full rounded-full" variant="outline">Select Package</Button>
                 </div>
              </TabsContent>
              
              <TabsContent value="reviews">
                <div className="space-y-6">
                  <div className="flex items-center mb-6">
                    <div className="text-4xl font-bold mr-4">{vendor.rating}</div>
                    <div>
                      <div className="flex text-yellow-400 mb-1">
                        <Star className="h-4 w-4 fill-yellow-400" /><Star className="h-4 w-4 fill-yellow-400" /><Star className="h-4 w-4 fill-yellow-400" /><Star className="h-4 w-4 fill-yellow-400" /><Star className="h-4 w-4 fill-yellow-400" />
                      </div>
                      <p className="text-sm text-gray-500">Based on {vendor.reviews} reviews</p>
                    </div>
                  </div>
                  
                  {/* Sample Review */}
                  <div className="border-b border-border-soft pb-6">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-bold">Wanjiku & Kamau</h4>
                      <span className="text-sm text-gray-500">2 months ago</span>
                    </div>
                    <div className="flex text-yellow-400 mb-3">
                        <Star className="h-3 w-3 fill-yellow-400" /><Star className="h-3 w-3 fill-yellow-400" /><Star className="h-3 w-3 fill-yellow-400" /><Star className="h-3 w-3 fill-yellow-400" /><Star className="h-3 w-3 fill-yellow-400" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">Absolutely amazing service! They captured our Ruracio perfectly. Very professional and the photos were delivered faster than expected. Highly recommend!</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="hidden md:block">
            <div className="sticky top-28 bg-white border border-border-soft rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Pricing</h3>
              <div className="flex justify-between items-end mb-6 pb-6 border-b border-border-soft">
                <span className="text-gray-500">Starting from</span>
                <span className="text-2xl font-bold">KES {vendor.startingPrice.toLocaleString()}</span>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center"><Clock className="h-4 w-4 mr-2" /> Response</span>
                  <span className="font-medium">{vendor.responseTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center"><MapPin className="h-4 w-4 mr-2" /> Base</span>
                  <span className="font-medium">{vendor.location}</span>
                </div>
              </div>
              
              <Button className="w-full rounded-full font-bold py-6 mb-3">Request Quote</Button>
              <Button variant="outline" className="w-full rounded-full border-green-200 text-green-700 hover:bg-green-50 font-bold py-6">
                <FaWhatsapp className="mr-2 h-5 w-5" /> Chat on WhatsApp
              </Button>
              
              <div className="flex justify-center gap-4 mt-6">
                <button className="flex flex-col items-center text-gray-500 hover:text-primary transition-colors">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-1"><Heart className="h-4 w-4" /></div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Save</span>
                </button>
                <button className="flex flex-col items-center text-gray-500 hover:text-primary transition-colors">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-1"><Share className="h-4 w-4" /></div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-border-soft p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40 flex gap-3">
         <Button className="flex-1 rounded-full font-bold shadow-soft">Request Quote</Button>
         <Button variant="outline" size="icon" className="rounded-full w-12 h-12 shrink-0 border-green-200 text-green-600 bg-green-50">
            <FaWhatsapp className="h-6 w-6" />
         </Button>
      </div>
    </div>
  );
}
