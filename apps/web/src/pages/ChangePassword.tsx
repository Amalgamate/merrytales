import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { useAuth, type AuthUser } from '@/contexts/AuthContext';

const roleHome = (role: AuthUser['role']) => ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(role) ? '/admin' : role === 'VENDOR' ? '/vendor' : role === 'STUDIO' ? '/studio' : '/app';

export function ChangePassword() {
  const { user, setSession } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (newPassword.length < 16) { setError('Use at least 16 characters for your new password.'); return; }
    if (newPassword !== confirmPassword) { setError('Your new passwords do not match.'); return; }
    setSubmitting(true);
    try {
      const data = await apiRequest<{ user: AuthUser; accessToken: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      setSession(data.user, data.accessToken);
      navigate(roleHome(data.user.role), { replace: true });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to change your password.'); }
    finally { setSubmitting(false); }
  }

  const isRequired = user.mustChangePassword;
  return <AuthShell eyebrow={isRequired ? "Security check" : "Account security"} title={isRequired ? "Set your own password" : "Change your password"} description={isRequired ? "Your temporary password can only be used once. Set a unique 16-character password to unlock the workspace." : "Use a unique 16-character password to keep your account secure."}>
    <form onSubmit={submit} className="space-y-5">
      {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-xl border border-primary/15 bg-pink-50/60 p-4 text-sm text-[#3a2340]"><ShieldCheck className="mb-2 h-5 w-5 text-primary" />{isRequired ? 'This step is required before you can access admin controls.' : 'You will remain signed in after your password is updated.'}</div>
      <label className="block text-sm font-bold text-[#25253f]">{isRequired ? 'Temporary password' : 'Current password'}<div className="relative mt-2"><KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input required autoComplete="current-password" type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="h-13 rounded-xl bg-white pl-11 text-base" /></div></label>
      <label className="block text-sm font-bold text-[#25253f]">New password<div className="relative mt-2"><KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input required minLength={16} autoComplete="new-password" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} className="h-13 rounded-xl bg-white pl-11 text-base" /></div></label>
      <label className="block text-sm font-bold text-[#25253f]">Confirm new password<div className="relative mt-2"><KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input required minLength={16} autoComplete="new-password" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="h-13 rounded-xl bg-white pl-11 text-base" /></div></label>
      <Button type="submit" isLoading={submitting} loadingText="Updating password…" className="h-13 w-full rounded-xl text-base font-bold">Secure my account</Button>
    </form>
  </AuthShell>;
}
