import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest, ApiError } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'VENDOR' | 'STUDIO' | 'STAFF' | 'ADMIN' | 'SUPERADMIN';
  mustChangePassword: boolean;
  emailVerified?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setSession: (user: AuthUser, token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!localStorage.getItem('merry_tales_access_token')) { setLoading(false); return; }
    apiRequest<AuthUser>('/auth/me')
      .then(setUser)
      .catch(async (err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          try {
            const { accessToken } = await apiRequest<{ accessToken: string }>('/auth/refresh', { method: 'POST' });
            localStorage.setItem('merry_tales_access_token', accessToken);
            const me = await apiRequest<AuthUser>('/auth/me');
            setUser(me);
          } catch {
            localStorage.removeItem('merry_tales_access_token');
          }
        } else {
          localStorage.removeItem('merry_tales_access_token');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setSession(nextUser: AuthUser, token: string) {
        localStorage.setItem('merry_tales_access_token', token);
        setUser(nextUser);
      },
      signOut() {
        apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
        localStorage.removeItem('merry_tales_access_token');
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
