import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  category: string;
  startingPrice: number;
  image: string;
  bestseller?: boolean;
}

export function ProductCard({ slug, name, category, startingPrice, image, bestseller }: ProductCardProps) {
  return (
    <Link to={`/shop/${slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-soft border border-border-soft transition-all hover:shadow-lg">
        <div className="relative h-64 overflow-hidden bg-muted flex items-center justify-center p-4">
          <img 
            src={image} 
            alt={name} 
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
          {bestseller && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-primary text-white border-none shadow-sm">
                Bestseller
              </Badge>
            </div>
          )}
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{category}</p>
          <h3 className="font-bold text-foreground mb-2">{name}</h3>
          <p className="font-bold text-primary">From KES {startingPrice.toLocaleString()}</p>
        </div>
      </div>
    </Link>
  );
}
