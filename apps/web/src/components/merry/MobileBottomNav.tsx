import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Users, LayoutDashboard, User } from 'lucide-react';

export function MobileBottomNav() {
  const location = useLocation();

  const links = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Shop', href: '/shop', icon: ShoppingBag },
    { name: 'Vendors', href: '/vendors', icon: Users },
    { name: 'Plan', href: '/plan', icon: LayoutDashboard },
    { name: 'Account', href: '/app', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-border-soft z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          const isActive = location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              to={link.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-primary' : 'text-gray-500 hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'fill-primary/10' : ''}`} />
              <span className="text-[10px] font-semibold">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
