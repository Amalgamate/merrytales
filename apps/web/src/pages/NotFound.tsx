import { Link } from 'react-router-dom';
import { Home, ShoppingBag, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <div className="pt-28 min-h-screen bg-background flex items-center justify-center px-4 pb-24">
      <div className="max-w-xl w-full text-center bg-white rounded-[35px] p-8 md:p-12 shadow-soft border border-border-soft">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary font-extrabold text-3xl">
          404
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-foreground">Page Not Found</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Oops! The page or category you are looking for doesn't exist or has moved. Explore our shop, vendors, or start your wedding workspace below.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <Link to="/">
            <Button variant="outline" className="w-full rounded-2xl py-5 text-xs font-bold border-border-soft hover:bg-muted">
              <Home className="h-4 w-4 mr-2" /> Home
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline" className="w-full rounded-2xl py-5 text-xs font-bold border-border-soft hover:bg-muted">
              <ShoppingBag className="h-4 w-4 mr-2" /> Shop
            </Button>
          </Link>
          <Link to="/vendors">
            <Button variant="outline" className="w-full rounded-2xl py-5 text-xs font-bold border-border-soft hover:bg-muted">
              <Users className="h-4 w-4 mr-2" /> Vendors
            </Button>
          </Link>
        </div>

        <Link to="/">
          <Button className="rounded-full px-8 py-6 font-bold shadow-soft">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
}
