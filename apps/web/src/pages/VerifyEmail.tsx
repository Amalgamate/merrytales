import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { apiRequest } from '@/lib/api';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setErrorMessage('No verification token found. Please check your email link.');
      setStatus('error');
      return;
    }

    apiRequest<{ ok: boolean }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        setErrorMessage(
          err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        );
        setStatus('error');
      });
  }, [searchParams]);

  return (
    <AuthShell
      eyebrow="Email verification"
      title="Verify your email"
      description="We're confirming your email address."
    >
      {status === 'loading' && (
        <div
          aria-live="polite"
          role="status"
          className="flex flex-col items-center gap-4 py-6 text-gray-500"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm">Verifying your email address…</p>
        </div>
      )}

      {status === 'success' && (
        <div aria-live="polite" role="status" className="space-y-6">
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-5 text-sm text-green-800">
            <p className="font-bold">Email verified!</p>
            <p className="mt-1 text-green-700">Your email address has been confirmed. You can now sign in to your account.</p>
          </div>
          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="font-bold text-primary hover:underline">
              Sign in to your account
            </Link>
          </p>
        </div>
      )}

      {status === 'error' && (
        <div aria-live="polite" role="alert" className="space-y-6">
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-5 text-sm text-red-800">
            <p className="font-bold">Verification failed</p>
            <p className="mt-1 text-red-700">{errorMessage}</p>
          </div>
          <p className="text-center text-sm text-gray-500">
            Didn't receive a link?{' '}
            <Link to="/login" className="font-bold text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
