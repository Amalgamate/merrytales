import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Mail, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/auth/AuthShell';
import { apiRequest } from '@/lib/api';
import { useAuth, type AuthUser } from '@/contexts/AuthContext';

export function Login() {
  const { user, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (user) { const home=['SUPERADMIN','ADMIN','STAFF'].includes(user.role)?'/admin':user.role==='VENDOR'?'/vendor':user.role==='STUDIO'?'/studio':'/app'; return <Navigate to={home} replace />; }
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setSubmitting(true); try { const data = await apiRequest<{ user: AuthUser; accessToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setSession(data.user, data.accessToken); const saved=localStorage.getItem('merry_tales_guest_plan');if(saved&&data.user.role==='CUSTOMER'){try{const draft=JSON.parse(saved) as {partnerOne?:string;partnerTwo?:string;eventDate?:string;city?:string;guestTarget?:string;budget?:string;celebrationType?:string;traditions?:string[];planningPreferences?:string[]};if(draft.eventDate&&draft.city){const partnerOne=draft.partnerOne?.trim()||data.user.firstName;const partnerTwo=draft.partnerTwo?.trim()||data.user.lastName;const slug=`${partnerOne}-${partnerTwo}-${new Date(draft.eventDate).getFullYear()}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');await apiRequest('/events',{method:'POST',body:JSON.stringify({title:`${partnerOne} & ${partnerTwo}'s Celebration`,slug,partnerOne,partnerTwo,eventDate:new Date(`${draft.eventDate}T09:00:00`).toISOString(),city:draft.city,budget:Number(draft.budget)||undefined,guestTarget:Number(draft.guestTarget)||undefined,celebrationType:draft.celebrationType||undefined,traditions:draft.traditions||[],planningPreferences:draft.planningPreferences||[]})});}localStorage.removeItem('merry_tales_guest_plan');}catch{/* A malformed local draft should not stop an existing customer from signing in. */}} const roleHome = ['SUPERADMIN','ADMIN','STAFF'].includes(data.user.role) ? '/admin' : data.user.role === 'VENDOR' ? '/vendor' : data.user.role === 'STUDIO' ? '/studio' : '/app'; const requested=(location.state as { from?: string } | null)?.from; navigate(requested && (requested !== '/app' || data.user.role === 'CUSTOMER') ? requested : roleHome, { replace: true }); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to sign in.'); } finally { setSubmitting(false); } }
  return <AuthShell eyebrow="Welcome back" title="Sign in to your workspace" description="Continue planning, selling or operating from exactly where you left off.">
    <form id="login-form" onSubmit={submit} className="space-y-5">
      {error&&<div role="alert" aria-live="polite" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <label htmlFor="email" className="block text-sm font-bold text-[#25253f]">Email address<div className="relative mt-2"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><Input id="email" name="email" required autoFocus autoComplete="username" inputMode="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="h-13 rounded-xl bg-white pl-11 text-base"/></div></label>
      <label htmlFor="current-password" className="block text-sm font-bold text-[#25253f]">Password<div className="relative mt-2"><KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><Input id="current-password" name="password" required autoComplete="current-password" type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" className="h-13 rounded-xl bg-white pl-11 pr-12 text-base"/><button type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(current=>!current)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">{showPassword?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div></label>
      <div className="flex justify-end text-sm"><a href="mailto:support@merrytales.co.ke?subject=Account access help" className="font-bold text-primary hover:underline">Need help signing in?</a></div>
      <Button type="submit" isLoading={submitting} loadingText="Signing you in…" className="h-13 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/20">Sign in</Button>
      <p className="text-center text-sm text-gray-500">New to Merry Tales? <Link to="/register" className="font-bold text-primary hover:underline">Create an account</Link></p>
      <div className="relative py-2"><div className="absolute inset-x-0 top-1/2 border-t"/><span className="relative mx-auto block w-fit bg-[#f7f6fa] px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">For businesses</span></div>
      <Link to="/vendor/join" className="flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-bold text-[#25253f] hover:border-primary/30 hover:text-primary"><Store className="h-4 w-4"/>Join or access your vendor business</Link>
    </form>
  </AuthShell>;
}
