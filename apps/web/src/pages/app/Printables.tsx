import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Printables() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-4">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Printables & Stationery</h1>
          <p className="text-gray-500">Manage your physical printed items.</p>
        </div>
        <Link to="/shop">
          <Button className="rounded-full shadow-soft"><Plus className="h-4 w-4 mr-2" /> Shop Printables</Button>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-border-soft shadow-sm p-12 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <FileText className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">No printables yet</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          You haven't ordered any physical printables like water bottle labels, table numbers, or physical invitations. All your custom physical items will appear here.
        </p>
        <Link to="/shop">
          <Button className="rounded-full font-bold px-8 py-6 text-lg">Browse the Print Shop</Button>
        </Link>
      </div>
    </div>
  );
}
