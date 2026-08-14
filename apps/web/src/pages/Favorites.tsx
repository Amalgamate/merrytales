import { Link } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/merry/ProductCard';
import { PageHero } from '@/components/merry/PageHero';
import { products } from '@/data/products';

export function Favorites() {
  const savedProducts = products.slice(0, 2); // Mock saved items

  return (
    <div className="pt-20 min-h-screen bg-gray-50 pb-32">
      <PageHero
        title="SAVED ITEMS"
        subtitle="Your curated wishlist of vendors, stationery, and inspiration."
        image="/african_vendor_hero.png"
        imageAlt="Saved Favorites"
        overlay="dark"
        height="sm"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">

        <div className="bg-white rounded-[30px] border border-border-soft shadow-sm p-6 md:p-10 mb-8">
          
          {savedProducts.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Products ({savedProducts.length})</h2>
                <div className="relative max-w-xs w-full hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Search saved items..." className="w-full bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {savedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <Heart className="h-16 w-16 mx-auto text-gray-200 mb-4" />
              <h2 className="text-2xl font-bold mb-2">You haven't saved anything yet</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">Click the heart icon on vendors, products, and stories you love to save them here for later.</p>
              <Link to="/shop">
                <Button className="rounded-full font-bold px-8">Browse the Shop</Button>
              </Link>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
