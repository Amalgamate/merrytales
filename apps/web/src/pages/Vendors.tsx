import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VendorCard } from '@/components/merry/VendorCard';
import { PageHero } from '@/components/merry/PageHero';
import { vendors } from '@/data/vendors';
import { marketplaceCategories } from '@/data/marketplace';

export function Vendors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  
  // Very simple filtering based on seed data
  const filteredVendors = useMemo(() => vendors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.location.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter((vendor)=>!location || vendor.location.toLowerCase()===location), [searchQuery, location]);
  const suggestions = searchQuery.trim() ? filteredVendors.slice(0, 5) : [];

  return (
    <div className="pt-20 min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <PageHero
        label="Merry Tales Marketplace"
        title="FIND THE PEOPLE WHO WILL MAKE YOUR DAY."
        subtitle="Discover and book Kenya's best wedding photographers, planners, decorators, and more."
        image="/african_vendor_hero.png"
        imageAlt="Wedding vendors at a Kenyan wedding"
        overlay="dark"
        height="md"
      >
        {/* Search Bar */}
        <div className="bg-white rounded-2xl md:rounded-full p-2 grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_auto] shadow-xl max-w-4xl mx-auto border border-border-soft">
          <div className="relative col-span-2 md:col-span-1 flex items-center px-4 h-12 border-b md:border-b-0 md:border-r border-gray-200">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="What are you looking for?"
              className="w-full focus:outline-none text-foreground bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            {searchQuery.trim() && <div className="absolute z-50 top-[calc(100%+10px)] left-0 right-0 md:w-[420px] bg-white border rounded-2xl shadow-2xl overflow-hidden text-left">{suggestions.length?suggestions.map(vendor=><Link key={vendor.id} to={`/vendors/${vendor.slug}`} className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-primary/5"><img src={vendor.image} alt="" className="h-10 w-10 rounded-full object-cover"/><span><strong className="block text-sm">{vendor.name}</strong><small className="text-gray-500">{vendor.category} · {vendor.location}</small></span></Link>):<p className="p-4 text-sm text-gray-500">No matching vendors.</p>}</div>}
          </div>
          <div className="flex items-center px-3 h-12 border-r md:border-r border-gray-200">
            <MapPin className="h-5 w-5 text-gray-400 mr-3" />
            <select value={location} onChange={(event)=>setLocation(event.target.value)} className="w-full focus:outline-none text-foreground bg-transparent appearance-none cursor-pointer">
                <option value="">Any Location</option>
                <option value="nairobi">Nairobi</option>
                <option value="mombasa">Mombasa</option>
                <option value="kisumu">Kisumu</option>
                <option value="naivasha">Naivasha</option>
              </select>
            </div>
            <div className="flex items-center px-3 h-12 md:border-r border-gray-200">
              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
              <input type="date" className="w-full focus:outline-none text-foreground bg-transparent uppercase text-sm" />
            </div>
            <Button onClick={()=>{setSearchQuery('');setLocation('');}} className="col-span-2 md:col-span-1 rounded-xl md:rounded-full px-6 h-11 font-bold w-full md:w-auto mt-1 md:mt-0">
              {searchQuery || location ? 'Clear' : 'Explore'}
            </Button>
          </div>
      </PageHero>

      {/* Featured Categories */}
      <div className="max-w-7xl mx-auto px-4 mt-32 sm:mt-28 md:mt-16 mb-12">
        <div className="flex overflow-x-auto pb-4 hide-scrollbar space-x-3">
          {marketplaceCategories.map(({name:cat}) => (
            <button key={cat} onClick={()=>setSearchQuery(cat)} className="flex-shrink-0 px-6 py-3 rounded-full border border-border-soft bg-white hover:border-primary hover:text-primary transition-colors font-medium shadow-sm">
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor Grid */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">{searchQuery || location ? `${filteredVendors.length} matching vendors` : 'Recommended Vendors'}</h2>
          <Button variant="outline" className="rounded-full">
            <Filter className="h-4 w-4 mr-2" /> Filters
          </Button>
        </div>
        
        {filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} {...vendor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-border-soft">
            <h3 className="text-xl font-bold mb-2">No vendors found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or removing filters.</p>
            <Button className="mt-4 rounded-full" onClick={() => setSearchQuery('')}>Clear Search</Button>
          </div>
        )}
      </div>
      
      {/* Join CTA */}
      <div className="max-w-7xl mx-auto px-4 mt-24 mb-12">
        <div className="bg-lavender-light rounded-3xl p-8 md:p-16 text-center border border-lavender-soft">
          <h2 className="text-3xl font-bold mb-4">Are you a wedding vendor?</h2>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto">Join the Merry Tales marketplace to reach more couples, manage your bookings, and grow your business.</p>
          <Button className="rounded-full px-8 py-6 font-bold shadow-soft">
            Join Merry Tales Marketplace
          </Button>
        </div>
      </div>
    </div>
  );
}
