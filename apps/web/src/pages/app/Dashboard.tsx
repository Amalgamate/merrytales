import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarHeart, CheckSquare, ShoppingBag, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function resendVerification() {
    setResending(true);
    try {
      await apiRequest('/auth/resend-verification', { method: 'POST' });
      setResent(true);
      setTimeout(() => setResent(false), 8000);
    } catch {
      // silently fail — user can try again
    } finally {
      setResending(false);
    }
  }

  const daysUntil = 345;
  const completedTasks = 12;
  const totalTasks = 48;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  const firstName = user?.firstName ?? 'there';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-4">

      {/* Email verification banner */}
      {user && user.emailVerified === false && (
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-sm">Verify your email address</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Check your inbox for a verification link, or request a new one below.
            </p>
          </div>
          <button
            onClick={() => void resendVerification()}
            disabled={resending || resent}
            className="shrink-0 rounded-xl border border-amber-200 bg-white px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
          >
            {resent ? 'Email sent ✓' : resending ? 'Sending…' : 'Resend verification'}
          </button>
        </div>
      )}
      <div className="bg-foreground text-white rounded-[30px] p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Welcome back, {firstName}!</h1>
          <p className="text-white/80 text-lg mb-8">You have {daysUntil} days until your big day! Let's get planning.</p>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-xl">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Planning Progress</span>
              <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-full text-sm">{progress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 mb-2">
              <div className="bg-primary h-3 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-sm text-white/70">{completedTasks} of {totalTasks} tasks completed</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link to="/app/invitation" className="bg-white p-4 rounded-2xl border border-border-soft shadow-sm hover:-translate-y-1 transition-transform text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                <CalendarHeart className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Invitations</span>
            </Link>
            <Link to="/vendors" className="bg-white p-4 rounded-2xl border border-border-soft shadow-sm hover:-translate-y-1 transition-transform text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <CheckSquare className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Vendors</span>
            </Link>
            <Link to="/shop" className="bg-white p-4 rounded-2xl border border-border-soft shadow-sm hover:-translate-y-1 transition-transform text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Shop Print</span>
            </Link>
            <Link to="/app/wedding" className="bg-white p-4 rounded-2xl border border-border-soft shadow-sm hover:-translate-y-1 transition-transform text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
                <Bell className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Guests</span>
            </Link>
          </div>

          {/* Next Tasks */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-border-soft shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Up Next For You</h2>
              <Link to="/app/wedding" className="text-sm font-semibold text-primary hover:underline">View All Tasks</Link>
            </div>
            
            <div className="space-y-4">
              {[
                { title: 'Finalize Guest List', due: 'in 2 days', priority: 'High', color: 'bg-red-100 text-red-700' },
                { title: 'Book Photographer', due: 'in 1 week', priority: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
                { title: 'Send Save the Dates', due: 'in 2 weeks', priority: 'Normal', color: 'bg-gray-100 text-gray-700' },
              ].map((task, i) => (
                <div key={i} className="flex items-center p-4 border border-border-soft rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-6 h-6 rounded-md border-2 border-gray-300 mr-4 flex-shrink-0"></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">{task.title}</h4>
                    <p className="text-xs text-gray-500">Due {task.due}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${task.color}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          
          {/* Active Orders */}
          <div className="bg-white rounded-3xl p-6 border border-border-soft shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Recent Orders</h2>
              <Link to="/app/orders" className="text-sm font-semibold text-primary hover:underline">View All</Link>
            </div>
            
            <div className="space-y-4">
              <div className="border border-border-soft rounded-2xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Order #MT-8492</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Designing</span>
                </div>
                <h4 className="font-bold text-sm mb-1">Animated WhatsApp Invite</h4>
                <p className="text-xs text-gray-500 mb-3">Expected delivery: Tomorrow</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full w-1/2"></div>
                </div>
              </div>
            </div>
            
            <Link to="/shop">
              <Button variant="outline" className="w-full rounded-full mt-4 text-xs font-bold">
                Shop More Items
              </Button>
            </Link>
          </div>
          
          {/* Inspiration Teaser */}
          <div className="bg-lavender-light rounded-3xl p-6 border border-lavender-soft text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="font-bold mb-2">Need Inspiration?</h3>
            <p className="text-sm text-gray-600 mb-4">Check out our latest real weddings and style guides.</p>
            <Link to="/stories">
              <Button className="w-full rounded-full font-bold shadow-sm bg-white text-foreground hover:bg-gray-50">
                Explore Stories
              </Button>
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}
