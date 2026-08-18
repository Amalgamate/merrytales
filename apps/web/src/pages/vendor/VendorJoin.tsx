import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, TrendingUp, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { useAuth, type AuthUser } from '@/contexts/AuthContext';
import { marketplaceSubcategories } from '@/data/marketplace';

export function VendorJoin() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ businessName:'', category:'Photography & Videography', firstName:'', lastName:'', email:'', phone:'', password:'', city:'Nairobi', description:'' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setProgress(15);
    try {
      const data = await apiRequest<{user:AuthUser;accessToken:string}>('/auth/register/vendor', { method:'POST', body:JSON.stringify({ ...form, phone:form.phone.trim(), whatsapp:form.phone.trim(), description:form.description||undefined }) });
      setProgress(100); setSession(data.user,data.accessToken); navigate('/vendor');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to submit vendor application.'); setProgress(undefined); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="pt-16 min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/african_vendor_hero.png" alt="Wedding Vendor" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6">Grow your event business with Merry Tales.</h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
            Join a curated marketplace for event professionals across Kenya. Reach customers planning personal, cultural and corporate occasions.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-border-soft shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Premium Storefront</h3>
              <p className="text-gray-600">Showcase your portfolio, pricing, packages, and real wedding features in high resolution.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-border-soft shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 mb-6">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified High Quality Leads</h3>
              <p className="text-gray-600">Connect with customers actively looking for reliable event products and services.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-border-soft shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Reviews</h3>
              <p className="text-gray-600">Build trust with authentic couple reviews and Merry Tales verified vendor badges.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-3xl border border-border-soft shadow-2xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold mb-3">Apply to Join the Network</h2>
              <p className="text-gray-600">Fill in your business details below to get started with your vendor dashboard.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Business Name</label>
                  <Input required value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})} placeholder="e.g. Safari Sunset Photography" className="bg-gray-50 h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none">
                    {marketplaceSubcategories.map(category=><option key={category}>{category}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Contact First Name</label>
                  <Input required value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} placeholder="First name" className="bg-gray-50 h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Email Address</label>
                  <Input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="hello@business.com" className="bg-gray-50 h-12" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><label className="space-y-2 text-sm font-bold">Contact Last Name<Input required value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} className="bg-gray-50 h-12"/></label><label className="space-y-2 text-sm font-bold">Phone / WhatsApp<Input required minLength={9} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="bg-gray-50 h-12"/></label><label className="space-y-2 text-sm font-bold">City<Input required value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="bg-gray-50 h-12"/></label><label className="space-y-2 text-sm font-bold">Password<Input required minLength={10} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 10 characters" className="bg-gray-50 h-12"/></label></div>
              <label className="space-y-2 text-sm font-bold block">Business Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full min-h-24 bg-gray-50 border rounded-md p-3 font-normal"/></label>
              
              <Button 
                type="submit" 
                isLoading={submitting} 
                loadingProgress={progress} 
                loadingText="Verifying & Opening Portal..." 
                className="w-full rounded-full py-6 font-bold text-lg mt-6 shadow-soft"
              >
                Create Vendor Account
              </Button>
              <p className="text-xs text-center text-gray-500 mt-4">Your storefront starts in pending review while you complete your profile.</p>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
