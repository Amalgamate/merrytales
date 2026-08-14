import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, PartyPopper as Sparkles, ShieldCheck } from 'lucide-react';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  image?: string;
}

export function AuthShell({ eyebrow, title, description, children, image = '/african_garden_wedding.png' }: AuthShellProps) {
  return <main className="min-h-screen bg-[#f7f6fa] lg:grid lg:grid-cols-[minmax(420px,46%)_1fr]">
    <section className="relative hidden min-h-screen overflow-hidden bg-[#171735] lg:flex lg:flex-col lg:justify-between p-10 xl:p-14 text-white">
      <img src={image} alt="A joyful Merry Tales celebration" className="absolute inset-0 h-full w-full object-cover opacity-55"/>
      <div className="absolute inset-0 bg-gradient-to-b from-[#171735]/45 via-[#171735]/55 to-[#171735]"/>
      <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-2 text-sm font-bold text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4"/>Back to Merry Tales</Link>
      <div className="relative z-10 max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-500"><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur"><Sparkles className="h-3.5 w-3.5 text-primary"/>Plan beautifully. Operate confidently.</div><h2 className="mt-5 text-4xl xl:text-5xl font-extrabold leading-[1.05] tracking-tight">Every celebration, vendor and payment in one calm workspace.</h2><p className="mt-5 max-w-lg text-base leading-7 text-white/70">From the first idea to the final thank-you, Merry Tales keeps the people and details that matter close.</p><div className="mt-8 grid gap-3 text-sm text-white/80 sm:grid-cols-2"><p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400"/>Curated Kenyan vendors</p><p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400"/>Event treasury tools</p><p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400"/>Invitations and guest planning</p><p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400"/>Secure account experience</p></div></div>
      <p className="relative z-10 flex items-center gap-2 text-xs text-white/45"><ShieldCheck className="h-4 w-4"/>Your information stays private and under your control.</p>
    </section>
    <section className="flex min-h-screen flex-col"><header className="flex h-20 items-center justify-between px-5 sm:px-8"><Link to="/" className="lg:hidden inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft className="h-4 w-4"/>Merry Tales</Link><div className="ml-auto flex items-center gap-2 text-xs text-gray-400"><ShieldCheck className="h-4 w-4"/>Secure access</div></header><div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8"><div className="w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-3 duration-300"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171735]">{title}</h1><p className="mt-3 text-sm sm:text-base leading-6 text-gray-500">{description}</p><div className="mt-8">{children}</div></div></div></section>
  </main>;
}
