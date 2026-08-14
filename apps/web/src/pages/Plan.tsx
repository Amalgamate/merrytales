import { CheckSquare, DollarSign, Users, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PageHero } from '@/components/merry/PageHero';

export function Plan() {
  return (
    <div className="pt-20 min-h-screen bg-background pb-32">
      {/* Hero Section */}
      <PageHero
        label="Merry Tales Planning"
        title="PLAN YOUR DREAM WEDDING."
        subtitle="Everything you need to organize your big day, all in one place. Create your workspace to get started."
        image="/african_planning_hero.png"
        imageAlt="Wedding Planning & Decor"
        overlay="dark"
        height="md"
      >
        <Link to="/create">
          <Button className="rounded-full px-8 py-6 font-bold shadow-soft text-lg">
            Start Your Wedding Hub &rarr;
          </Button>
        </Link>
      </PageHero>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 mt-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Your Planning Tools</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-border-soft flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <CheckSquare className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Checklist</h3>
            <p className="text-gray-500 text-sm mb-4">A customized timeline of tasks leading up to your wedding day.</p>
            <div className="mt-auto text-primary font-semibold text-sm flex items-center">Preview Tool <ArrowRight className="h-4 w-4 ml-1" /></div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-border-soft flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 mb-4">
              <DollarSign className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Budget</h3>
            <p className="text-gray-500 text-sm mb-4">Track expenses, manage payments, and stay on top of your spending.</p>
            <div className="mt-auto text-primary font-semibold text-sm flex items-center">Preview Tool <ArrowRight className="h-4 w-4 ml-1" /></div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-border-soft flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Guest List</h3>
            <p className="text-gray-500 text-sm mb-4">Collect RSVPs easily and organize seating arrangements effortlessly.</p>
            <div className="mt-auto text-primary font-semibold text-sm flex items-center">Preview Tool <ArrowRight className="h-4 w-4 ml-1" /></div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-border-soft flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Vendor Team</h3>
            <p className="text-gray-500 text-sm mb-4">Keep all your vendor contacts, contracts, and messages organized.</p>
            <div className="mt-auto text-primary font-semibold text-sm flex items-center">Preview Tool <ArrowRight className="h-4 w-4 ml-1" /></div>
          </div>
        </div>
      </div>
      
      {/* Visual Workspace Preview */}
      <div className="max-w-7xl mx-auto px-4 mt-24">
        <div className="bg-foreground text-white rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
          <div className="md:w-1/2 z-10 text-white">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-white leading-tight">Your personal wedding dashboard.</h2>
            <p className="text-lg md:text-xl text-white font-medium mb-8 leading-relaxed">
              When you start your wedding with Merry Tales, you get a dedicated workspace to manage your story, guests, vendors, and orders.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-white font-semibold"><CheckSquare className="h-5 w-5 text-primary mr-3 flex-shrink-0" /> Track your overall planning progress</li>
              <li className="flex items-center text-white font-semibold"><CheckSquare className="h-5 w-5 text-primary mr-3 flex-shrink-0" /> Build your digital invitations</li>
              <li className="flex items-center text-white font-semibold"><CheckSquare className="h-5 w-5 text-primary mr-3 flex-shrink-0" /> Chat directly with booked vendors</li>
            </ul>
            <Link to="/create">
              <Button className="rounded-full px-8 py-6 font-bold text-foreground bg-white hover:bg-gray-100">
                Create My Account
              </Button>
            </Link>
          </div>
          <div className="md:w-1/2 relative z-10">
            {/* Mock Dashboard UI Graphic */}
            <div className="bg-white text-foreground rounded-3xl shadow-2xl p-6 border-4 border-white/20 transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-border-soft">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Live Workspace Preview</span>
                  <h3 className="font-extrabold text-xl text-foreground">Wanjiku & Kamau's Celebration</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">📍 Naivasha Gardens • Dec 18, 2026</p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-extrabold border border-primary/20">
                    62% Ready
                  </span>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">345 Days to Go</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5 bg-lavender-light p-3.5 rounded-2xl border border-border-soft">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-foreground">Planning Checklist</span>
                  <span className="text-primary">12 of 48 Tasks Completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>

              {/* Active Tasks & Orders */}
              <div className="space-y-3">
                <div className="p-3 bg-white border border-border-soft rounded-2xl flex items-center justify-between shadow-xs hover:border-primary/40 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                      💌
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Animated WhatsApp Invitation</h4>
                      <p className="text-[10px] text-gray-500">Story Tale • Custom Audio</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                    Sent (140 Guests)
                  </span>
                </div>

                <div className="p-3 bg-white border border-border-soft rounded-2xl flex items-center justify-between shadow-xs hover:border-primary/40 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      💧
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Custom Maji Labels (Dusty Rose)</h4>
                      <p className="text-[10px] text-gray-500">150 Bottles • M-Pesa Paid</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                    Printed & Ready
                  </span>
                </div>

                <div className="p-3 bg-white border border-border-soft rounded-2xl flex items-center justify-between shadow-xs hover:border-primary/40 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                      📸
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Mombasa Moments Photography</h4>
                      <p className="text-[10px] text-gray-500">Lead Photographer Booked</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                    Confirmed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
