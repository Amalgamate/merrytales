import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface VendorCardProps {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  startingPrice: number;
  verified: boolean;
  image: string;
}

export function VendorCard({ slug, name, category, location, rating, reviews, startingPrice, verified, image }: VendorCardProps) {
  return (
    <Link to={`/vendors/${slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-soft border border-border-soft transition-all hover:shadow-lg">
        <div className="relative h-48 overflow-hidden bg-muted">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {verified && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-white text-primary border-none shadow-sm font-semibold">
                Verified
              </Badge>
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">{category}</p>
              <h3 className="font-bold text-lg leading-tight text-foreground">{name}</h3>
            </div>
            <div className="flex items-center bg-muted px-2 py-1 rounded-md">
              <span className="text-sm font-bold text-foreground">{rating}</span>
              <span className="text-xs text-gray-500 ml-1">({reviews})</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border-soft">
            <div className="text-sm text-gray-500 flex items-center">
              📍 {location}
            </div>
            <div className="text-sm font-bold text-foreground">
              From KES {startingPrice.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
