import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/auth/AuthShell';
import { apiRequest } from '@/lib/api';

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <AuthShell
        eyebrow="Account recovery"
        title="Invalid reset link"
        description="This password reset link is missing a token."
      >
        <div aria-live="polite" role="alert" className="space-y-5">
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Invalid reset link. Please request a new one.
          </div>
          <p className="text-center text-sm text-gray-500">
            <Link to="/forgot-password" className="font-bold text-primary hover:underline">
              Request a new reset link
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Set a new password"
      description="Choose a strong password with at least 10 characters."
    >
      {success ? (
        <div aria-live="polite" role="status" className="space-y-6">
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-5 text-sm text-green-800">
            <p className="font-bold">Password updated successfully</p>
            <p className="mt-1 text-green-700">You can now sign in with your new password.</p>
          </div>
          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="font-bold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      ) : (
        <form id="reset-password-form" onSubmit={submit} className="space-y-5">
          {error && (
            <div role="alert" aria-live="polite" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <label htmlFor="new-password" className="block text-sm font-bold text-[#25253f]">
            New password
            <div className="relative mt-2">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="new-password"
                name="new-password"
                required
                autoFocus
                autoComplete="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 10 characters"
                className="h-13 rounded-xl bg-white pl-11 pr-12 text-base"
              />
              <button
                type="button"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowNewPassword(current => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <label htmlFor="confirm-password" className="block text-sm font-bold text-[#25253f]">
            Confirm new password
            <div className="relative mt-2">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="confirm-password"
                name="confirm-password"
                required
                autoComplete="new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="h-13 rounded-xl bg-white pl-11 pr-12 text-base"
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirmPassword(current => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <Button
            type="submit"
            isLoading={submitting}
            loadingText="Updating password…"
            className="h-13 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/20"
          >
            Update password
          </Button>
          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="font-bold text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
