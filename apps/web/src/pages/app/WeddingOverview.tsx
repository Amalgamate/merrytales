import { useState } from 'react';
import { Calendar, MapPin, Edit3, Heart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function WeddingOverview() {
  const [guests] = useState([
    { id: 1, name: 'Alice Kamau', role: 'Bridesmaid', rsvp: 'Attending', meal: 'Chicken' },
    { id: 2, name: 'David Ochieng', role: 'Groomsman', rsvp: 'Attending', meal: 'Beef' },
    { id: 3, name: 'Sarah Wanjiku', role: 'Guest', rsvp: 'Pending', meal: '-' },
    { id: 4, name: 'Michael Njoroge', role: 'Guest', rsvp: 'Declined', meal: '-' },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-4">
      
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Wedding</h1>
          <p className="text-gray-500">Manage your event details, guests, and timeline.</p>
        </div>
        <Button className="rounded-full shadow-soft"><Edit3 className="h-4 w-4 mr-2" /> Edit Details</Button>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-2xl border border-border-soft shadow-sm">
           <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Days To Go</p>
           <h3 className="text-3xl font-extrabold text-foreground">345</h3>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-border-soft shadow-sm">
           <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Invited Guests</p>
           <h3 className="text-3xl font-extrabold text-foreground">150</h3>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-border-soft shadow-sm">
           <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">RSVPs Received</p>
           <h3 className="text-3xl font-extrabold text-green-600">42</h3>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-border-soft shadow-sm">
           <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Budget Spent</p>
           <h3 className="text-3xl font-extrabold text-primary">30%</h3>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-border-soft shadow-sm overflow-hidden">
        <Tabs defaultValue="details" className="w-full">
          <div className="px-6 pt-6 border-b border-border-soft">
            <TabsList className="bg-transparent h-auto p-0 flex-wrap justify-start gap-6">
              <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-base">Event Details</TabsTrigger>
              <TabsTrigger value="guests" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-base">Guest List</TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-base">Timeline</TabsTrigger>
              <TabsTrigger value="vendors" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-base">My Vendors</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-6 md:p-8">
            <TabsContent value="details" className="space-y-8 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center"><Calendar className="h-5 w-5 mr-2 text-primary" /> Date & Time</h3>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="font-bold text-foreground mb-1">Saturday, December 12, 2026</p>
                    <p className="text-sm text-gray-500">Ceremony starts at 10:00 AM</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center"><MapPin className="h-5 w-5 mr-2 text-primary" /> Venues</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ceremony</p>
                      <p className="font-bold text-foreground mb-1">St. Paul's Chapel</p>
                      <p className="text-sm text-gray-500">University Way, Nairobi</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reception</p>
                      <p className="font-bold text-foreground mb-1">Windsor Golf Hotel & Country Club</p>
                      <p className="text-sm text-gray-500">Kigwa Road, Nairobi</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-border-soft">
                <h3 className="font-bold text-lg mb-4 flex items-center"><Heart className="h-5 w-5 mr-2 text-primary" /> Brand & Style</h3>
                <div className="flex items-center space-x-6">
                  <div>
                     <p className="text-sm text-gray-500 mb-2 font-semibold">Theme Colors</p>
                     <div className="flex space-x-2">
                       <div className="w-8 h-8 rounded-full bg-yellow-600 shadow-inner"></div>
                       <div className="w-8 h-8 rounded-full bg-emerald-800 shadow-inner"></div>
                       <div className="w-8 h-8 rounded-full bg-orange-100 border border-gray-200 shadow-inner"></div>
                     </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2 font-semibold">Aesthetic</p>
                    <p className="font-bold">African Luxury</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="guests" className="mt-0">
               <div className="flex justify-between items-center mb-6">
                 <div className="relative max-w-sm w-full">
                   <Input placeholder="Search guests..." className="rounded-full bg-gray-50 border-gray-200 pl-4 h-10" />
                 </div>
                 <Button className="rounded-full"><Plus className="h-4 w-4 mr-1" /> Add Guest</Button>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-border-soft">
                       <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                       <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                       <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">RSVP Status</th>
                       <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Meal Pref</th>
                       <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {guests.map((guest) => (
                       <tr key={guest.id} className="border-b border-border-soft hover:bg-gray-50/50">
                         <td className="py-4 px-4 font-semibold">{guest.name}</td>
                         <td className="py-4 px-4 text-sm text-gray-600">{guest.role}</td>
                         <td className="py-4 px-4">
                           <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                             guest.rsvp === 'Attending' ? 'bg-green-100 text-green-700' :
                             guest.rsvp === 'Declined' ? 'bg-red-100 text-red-700' :
                             'bg-gray-100 text-gray-700'
                           }`}>
                             {guest.rsvp}
                           </span>
                         </td>
                         <td className="py-4 px-4 text-sm text-gray-600">{guest.meal}</td>
                         <td className="py-4 px-4 text-right">
                           <button className="text-sm text-primary font-semibold hover:underline">Edit</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-0">
               <div className="text-center py-12">
                 <h3 className="text-xl font-bold mb-2">Timeline Builder Coming Soon</h3>
                 <p className="text-gray-500 mb-6">Create a detailed schedule for your wedding day.</p>
                 <Button variant="outline" className="rounded-full">Get Notified</Button>
               </div>
            </TabsContent>

            <TabsContent value="vendors" className="mt-0">
               <div className="text-center py-12">
                 <h3 className="text-xl font-bold mb-2">No vendors booked yet</h3>
                 <p className="text-gray-500 mb-6">Explore the marketplace to find your perfect team.</p>
                 <Button className="rounded-full">Explore Vendors</Button>
               </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
