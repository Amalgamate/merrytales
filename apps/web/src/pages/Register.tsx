import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Phone, Store, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/auth/AuthShell';
import { apiRequest } from '@/lib/api';
import { useAuth, type AuthUser } from '@/contexts/AuthContext';

export function Register() {
  const navigate=useNavigate();
  const {setSession}=useAuth();
  const [form,setForm]=useState({fullName:'',email:'',phone:'',password:''});
  const [showPassword,setShowPassword]=useState(false);
  const [error,setError]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const strength=useMemo(()=>[form.password.length>=10,/[A-Z]/.test(form.password),/[0-9]/.test(form.password),/[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length,[form.password]);
  const submit=async(event:FormEvent)=>{event.preventDefault();setError('');const names=form.fullName.trim().split(/\s+/);if(names.length<2){setError('Please enter your first and last name.');return;}setSubmitting(true);try{const data=await apiRequest<{user:AuthUser;accessToken:string}>('/auth/register',{method:'POST',body:JSON.stringify({firstName:names[0],lastName:names.slice(1).join(' '),email:form.email,phone:form.phone||undefined,password:form.password})});setSession(data.user,data.accessToken);navigate('/app');}catch(cause){setError(cause instanceof Error?cause.message:'Unable to create account.');}finally{setSubmitting(false);}};
  return <AuthShell eyebrow="Start planning" title="Create your Merry Tales account" description="One account gives you planning tools, event finances, invitations, orders and access to verified vendors." image="/african_ruracio_story.png">
    <div className="mb-6 grid grid-cols-2 gap-3"><div className="rounded-xl border border-primary bg-primary/[0.05] p-3"><UserRound className="h-4 w-4 text-primary"/><p className="mt-2 text-sm font-bold">Planning an event</p><p className="mt-0.5 text-[11px] text-gray-500">Create a personal account below.</p></div><Link to="/vendor/join" className="rounded-xl border bg-white p-3 hover:border-primary/40"><Store className="h-4 w-4 text-gray-500"/><p className="mt-2 text-sm font-bold">Growing a business</p><p className="mt-0.5 text-[11px] text-gray-500">Open a vendor workspace.</p></Link></div>
    <form id="registration-form" onSubmit={submit} className="space-y-4">
      {error&&<div role="alert" aria-live="polite" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <label htmlFor="full-name" className="block text-sm font-bold">Full name<div className="relative mt-2"><UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><Input id="full-name" name="name" required autoFocus autoComplete="name" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} placeholder="Your first and last name" className="h-12 rounded-xl bg-white pl-11"/></div></label>
      <label htmlFor="register-email" className="block text-sm font-bold">Email address<div className="relative mt-2"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><Input id="register-email" name="email" required autoComplete="email" inputMode="email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" className="h-12 rounded-xl bg-white pl-11"/></div></label>
      <label htmlFor="phone" className="block text-sm font-bold">Phone number <span className="font-normal text-gray-400">(optional)</span><div className="relative mt-2"><Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><Input id="phone" name="tel" autoComplete="tel" inputMode="tel" type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0712 345 678" className="h-12 rounded-xl bg-white pl-11"/></div></label>
      <label htmlFor="new-password" className="block text-sm font-bold">Create a password<div className="relative mt-2"><Input id="new-password" name="new-password" required minLength={10} autoComplete="new-password" type={showPassword?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 10 characters" className="h-12 rounded-xl bg-white pr-12"/><button type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(current=>!current)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:bg-gray-100">{showPassword?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div>{form.password&&<div className="mt-2"><div className="grid grid-cols-4 gap-1">{[0,1,2,3].map(item=><span key={item} className={`h-1 rounded-full ${item<strength?strength<3?'bg-amber-400':'bg-green-500':'bg-gray-200'}`}/>)}</div><p className="mt-1.5 text-[11px] text-gray-500">{strength<2?'Use 10+ characters with a number.':strength<4?'Good password. Add variety to make it stronger.':'Strong password.'}</p></div>}</label>
      <p className="text-xs leading-5 text-gray-500">By creating an account, you agree to use Merry Tales responsibly and accept our privacy and marketplace terms.</p>
      <Button type="submit" isLoading={submitting} loadingText="Creating your workspace…" className="h-13 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/20">Create my planning account</Button>
      <p className="text-center text-sm text-gray-500">Already registered? <Link className="font-bold text-primary hover:underline" to="/login">Sign in</Link></p>
    </form>
  </AuthShell>;
}
