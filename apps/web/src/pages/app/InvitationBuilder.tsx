import { useState } from 'react';
import { Smartphone, Mail, Share2, Eye, Download, PlayCircle, Settings, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InvitationBuilder() {
  const [activeView, setActiveView] = useState('whatsapp');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-4 pb-20 md:pb-0">
      
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold mb-1">Digital Invitations</h1>
          <p className="text-gray-500">Manage your WhatsApp cards, animated videos, and email invites.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border-soft shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Sidebar - Navigation */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border-soft bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-border-soft">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Select Format</h3>
          </div>
          <div className="flex-1 p-2 space-y-1">
            <button 
              onClick={() => setActiveView('whatsapp')}
              className={`w-full flex items-center p-3 rounded-xl transition-colors text-left ${activeView === 'whatsapp' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-gray-100 text-gray-700 font-semibold'}`}
            >
              <Smartphone className={`h-5 w-5 mr-3 ${activeView === 'whatsapp' ? 'text-primary' : 'text-gray-400'}`} />
              WhatsApp Card
            </button>
            <button 
              onClick={() => setActiveView('animated')}
              className={`w-full flex items-center p-3 rounded-xl transition-colors text-left ${activeView === 'animated' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-gray-100 text-gray-700 font-semibold'}`}
            >
              <PlayCircle className={`h-5 w-5 mr-3 ${activeView === 'animated' ? 'text-primary' : 'text-gray-400'}`} />
              Animated Video
            </button>
            <button 
              onClick={() => setActiveView('email')}
              className={`w-full flex items-center p-3 rounded-xl transition-colors text-left ${activeView === 'email' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-gray-100 text-gray-700 font-semibold'}`}
            >
              <Mail className={`h-5 w-5 mr-3 ${activeView === 'email' ? 'text-primary' : 'text-gray-400'}`} />
              Email Invite
            </button>
            <button 
              onClick={() => setActiveView('website')}
              className={`w-full flex items-center p-3 rounded-xl transition-colors text-left ${activeView === 'website' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-gray-100 text-gray-700 font-semibold'}`}
            >
              <Share2 className={`h-5 w-5 mr-3 ${activeView === 'website' ? 'text-primary' : 'text-gray-400'}`} />
              Event Website
            </button>
          </div>
        </div>

        {/* Right Content Area - Builder/Preview */}
        <div className="flex-1 flex flex-col md:flex-row bg-gray-100/50">
          
          {/* Builder Controls */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-border-soft bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {activeView === 'whatsapp' && 'WhatsApp Card Details'}
                {activeView === 'animated' && 'Animated Video Script'}
                {activeView === 'email' && 'Email Template'}
                {activeView === 'website' && 'Website Settings'}
              </h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Published</span>
            </div>
            
            <div className="flex-1 space-y-6 overflow-y-auto pr-2">
              <div className="space-y-3">
                <label className="text-sm font-bold">Theme Style</label>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-yellow-600 mr-3"></div>
                    <span className="font-semibold">African Luxury</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary h-8"><Edit3 className="h-4 w-4 mr-1" /> Change</Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-bold">Main Text</label>
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm font-medium">
                  John & Mary invite you to celebrate their wedding.<br/>
                  Saturday, Dec 12, 2026<br/>
                  10:00 AM
                </div>
                <Button variant="outline" size="sm" className="w-full"><Edit3 className="h-4 w-4 mr-2" /> Edit Content</Button>
              </div>

              {activeView === 'animated' && (
                <div className="space-y-3">
                  <label className="text-sm font-bold">Background Music</label>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                    <div className="flex items-center">
                      <PlayCircle className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="font-semibold text-sm">Acoustic Love (0:45)</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary h-8">Change</Button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 mt-auto grid grid-cols-2 gap-3">
              <Button variant="outline" className="rounded-xl"><Settings className="h-4 w-4 mr-2" /> Settings</Button>
              <Button className="rounded-xl shadow-soft"><Download className="h-4 w-4 mr-2" /> Download</Button>
            </div>
          </div>

          {/* Live Preview Pane */}
          <div className="w-full md:w-1/2 p-6 flex flex-col items-center justify-center bg-gray-50">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center">
              <Eye className="h-4 w-4 mr-2" /> Live Preview
            </h3>
            
            {/* Phone Mockup Frame */}
            <div className="relative w-[280px] h-[580px] bg-black rounded-[40px] shadow-2xl p-3 ring-1 ring-gray-200/50">
              <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
                <div className="w-24 h-6 bg-black rounded-b-xl"></div>
              </div>
              <div className="w-full h-full bg-white rounded-[28px] overflow-hidden relative border border-gray-800">
                
                {/* Simulated Content inside phone */}
                <div className="absolute inset-0 bg-yellow-50 flex flex-col items-center justify-center p-6 text-center">
                   <div className="w-full aspect-square mb-6 rounded-full border-4 border-yellow-200/50 flex items-center justify-center relative overflow-hidden bg-white">
                      <img src="/african_stories_hero.png" alt="Floral pattern" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply" />
                      <div className="relative z-10 text-yellow-800">
                        <h2 className="font-script text-5xl mb-2">J & M</h2>
                      </div>
                   </div>
                   
                   <p className="text-[10px] uppercase tracking-widest text-yellow-800/60 font-bold mb-4">Together with their families</p>
                   <h3 className="text-2xl font-bold text-yellow-900 mb-2 font-serif">John Doe <br/>&<br/> Mary Wanjiku</h3>
                   <p className="text-sm text-yellow-800/80 mb-6">Invite you to share in their joy</p>
                   
                   <div className="bg-yellow-900 text-white rounded-xl py-3 px-6 w-full shadow-sm mb-4">
                     <p className="font-bold text-sm mb-1">12 . 12 . 2026</p>
                     <p className="text-[10px] uppercase tracking-wider">At Ten O'Clock In The Morning</p>
                   </div>
                   
                   {activeView === 'animated' && (
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
                       <PlayCircle className="h-16 w-16 text-white opacity-90" />
                     </div>
                   )}
                </div>
                
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-6 text-center max-w-xs">
              This preview shows how your invite will appear on most mobile devices.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
