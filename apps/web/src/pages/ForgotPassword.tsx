import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/auth/AuthShell';
import { apiRequest } from '@/lib/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      description="Enter your email address and we'll send you a link to reset your password."
    >
      {submitted ? (
        <div aria-live="polite" role="status" className="space-y-6">
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-5 text-sm text-green-800">
            <p className="font-bold">Check your email</p>
            <p className="mt-1 text-green-700">
              If an account with <span className="font-semibold">{email}</span> exists, you'll receive a password
              reset link shortly.
            </p>
          </div>
          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="font-bold text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      ) : (
        <form id="forgot-password-form" onSubmit={submit} className="space-y-5">
          {error && (
            <div role="alert" aria-live="polite" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <label htmlFor="forgot-email" className="block text-sm font-bold text-[#25253f]">
            Email address
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="forgot-email"
                name="email"
                required
                autoFocus
                autoComplete="email"
                inputMode="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-13 rounded-xl bg-white pl-11 text-base"
              />
            </div>
          </label>
          <Button
            type="submit"
            isLoading={submitting}
            loadingText="Sending reset link…"
            className="h-13 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/20"
          >
            Send reset link
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
