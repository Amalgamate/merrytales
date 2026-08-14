import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, User, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { useAuth, type AuthUser } from '@/contexts/AuthContext';

export function Create() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [form, setForm] = useState({ partnerOne: '', partnerTwo: '', eventDate: '', city: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const handleNext = async () => {
    setError('');
    if (step < 3) {
      setStep(step + 1);
    } else {
      if (!form.partnerOne || !form.partnerTwo || !form.eventDate || !form.city || !form.email || form.password.length < 10) {
        setError('Complete every field and use a password of at least 10 characters.');
        return;
      }
      setSubmitting(true);
      try {
        const names = form.partnerOne.trim().split(/\s+/);
        const auth = await apiRequest<{ user: AuthUser; accessToken: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ email: form.email, password: form.password, firstName: names[0], lastName: names.slice(1).join(' ') || form.partnerTwo.trim() }) });
        setSession(auth.user, auth.accessToken);
        const slug = `${form.partnerOne}-${form.partnerTwo}-${new Date(form.eventDate).getFullYear()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await apiRequest('/events', { method: 'POST', body: JSON.stringify({ title: `${form.partnerOne} & ${form.partnerTwo}'s Wedding`, slug, partnerOne: form.partnerOne, partnerTwo: form.partnerTwo, eventDate: new Date(`${form.eventDate}T09:00:00`).toISOString(), city: form.city }) });
        navigate('/app');
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'We could not create your workspace.'); }
      finally { setSubmitting(false); }
    }
  };

  const themes = [
    { id: 'luxury', name: 'African Luxury', color: 'bg-yellow-600', img: '/african_stories_hero.png' },
    { id: 'minimal', name: 'Modern Minimalist', color: 'bg-gray-800', img: '/african_garden_wedding.png' },
    { id: 'rustic', name: 'Rustic Charm', color: 'bg-amber-700', img: '/african_ruracio_story.png' },
  ];

  const [selectedTheme, setSelectedTheme] = useState('luxury');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      
      {/* Progress Header */}
      <div className="max-w-3xl mx-auto w-full px-4 mb-8 pt-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
          
          {[1, 2, 3].map((num) => (
            <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
              step >= num ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {step > num ? <Check className="h-5 w-5" /> : num}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>The Details</span>
          <span className="text-center">Brand Kit</span>
          <span className="text-right">Account</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-start justify-center px-4 pb-24">
        <div className="bg-white rounded-[30px] shadow-soft border border-border-soft p-8 md:p-12 w-full max-w-3xl">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Let's start your story.</h1>
                <p className="text-gray-500 text-lg">Tell us a bit about your upcoming celebration.</p>
              </div>
              
              <div className="space-y-6 max-w-xl mx-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">Partner 1</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input required value={form.partnerOne} onChange={update('partnerOne')} placeholder="John" className="pl-10 h-14 rounded-xl text-lg bg-gray-50 border-gray-200 focus:bg-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">Partner 2</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input required value={form.partnerTwo} onChange={update('partnerTwo')} placeholder="Mary" className="pl-10 h-14 rounded-xl text-lg bg-gray-50 border-gray-200 focus:bg-white" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Wedding Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input required value={form.eventDate} onChange={update('eventDate')} type="date" className="pl-10 h-14 rounded-xl text-lg bg-gray-50 border-gray-200 focus:bg-white uppercase" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input required value={form.city} onChange={update('city')} placeholder="E.g. Nairobi, Kenya" className="pl-10 h-14 rounded-xl text-lg bg-gray-50 border-gray-200 focus:bg-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Choose your aesthetic.</h1>
                <p className="text-gray-500 text-lg">This sets the default theme for your invitations, website, and printables. You can always change it later.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {themes.map((theme) => (
                  <div 
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                      selectedTheme === theme.id ? 'border-primary ring-4 ring-primary/20 scale-105 shadow-lg' : 'border-border-soft hover:border-gray-300'
                    }`}
                  >
                    <div className="h-48 relative">
                      <img src={theme.img} alt={theme.name} className="w-full h-full object-cover" />
                      {selectedTheme === theme.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-white rounded-full p-2 shadow-lg">
                            <Check className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-white text-center">
                      <h3 className="font-bold text-foreground mb-1">{theme.name}</h3>
                      <div className={`w-6 h-6 rounded-full mx-auto ${theme.color}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Secure your workspace.</h1>
                <p className="text-gray-500 text-lg">Create an account to save your progress and manage your wedding.</p>
              </div>
              
              <div className="space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Email Address</label>
                  <Input required value={form.email} onChange={update('email')} type="email" placeholder="john.doe@example.com" className="h-14 rounded-xl text-lg bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Password</label>
                  <Input required minLength={10} value={form.password} onChange={update('password')} type="password" placeholder="At least 10 characters" className="h-14 rounded-xl text-lg bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
                
                <div className="pt-2">
                  <p className="text-xs text-gray-500 text-center mb-4">
                    By clicking Create Account, you agree to Merry Tales' Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && <div role="alert" className="max-w-xl mx-auto mt-6 rounded-xl bg-red-50 text-red-700 p-4 text-sm">{error}</div>}
          {/* Navigation Buttons */}
          <div className="mt-12 pt-8 border-t border-border-soft flex items-center justify-between max-w-xl mx-auto">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="font-bold">
                Back
              </Button>
            ) : (
              <div></div> // Empty div for flex spacing
            )}
            
            <Button disabled={submitting} onClick={() => void handleNext()} className="rounded-full px-8 py-6 font-bold shadow-soft">
              {submitting ? 'Creating your workspace…' : step === 3 ? 'Create Account & Start' : 'Continue'} 
              {step !== 3 && <ChevronRight className="h-5 w-5 ml-1" />}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
