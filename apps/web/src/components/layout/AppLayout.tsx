import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarHeart, Mail, Package, Camera, FileText, Bell, Settings, LogOut, Landmark, Gift } from 'lucide-react';
import { MobileBottomNav } from '../merry/MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
    { name: 'My Wedding', href: '/app/wedding', icon: CalendarHeart },
    { name: 'Event Treasury', href: '/app/treasury', icon: Landmark },
    { name: 'Invitations', href: '/app/invitation', icon: Mail },
    { name: 'Printables', href: '/app/printables', icon: FileText },
    { name: 'Memories', href: '/app/memories', icon: Camera },
    { name: 'Orders', href: '/app/orders', icon: Package },
    { name: 'Refer & Earn', href: '/app/referrals', icon: Gift },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border-soft bg-white">
        <div className="p-6 border-b border-border-soft flex items-center justify-center">
          <Link to="/">
            <img src="/logo.png" alt="Merry Tales" className="h-10 w-auto" />
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="mb-6 px-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Workspace</h3>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mr-3">
                {user?.firstName[0]}{user?.lastName[0]}
              </div>
              <div>
                <p className="font-bold text-sm">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">Wedding workspace</p>
              </div>
            </div>
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-600 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-border-soft">
          <Link to="/app/settings" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-xl hover:bg-muted transition-colors">
            <Settings className="mr-3 h-5 w-5 text-gray-400" />
            Settings
          </Link>
          <button onClick={() => { signOut(); navigate('/'); }} className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors">
            <LogOut className="mr-3 h-5 w-5 text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white border-b border-border-soft z-10 shrink-0">
           <div className="font-bold">{user?.firstName}'s Workspace</div>
           <button className="text-gray-500">
             <Bell className="h-5 w-5" />
           </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Re-use global MobileBottomNav but it's already in App.tsx globally? 
          Actually, since AppLayout replaces the main layout, we need it here for mobile */}
      <MobileBottomNav />
    </div>
  );
}
