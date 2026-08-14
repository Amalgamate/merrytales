import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
const roleHome=(role:string)=>['SUPERADMIN','ADMIN','STAFF'].includes(role)?'/admin':role==='VENDOR'?'/vendor':role==='STUDIO'?'/studio':'/app';
export function ProtectedRoute({ roles }: { roles?: string[] }) { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <div className="min-h-screen grid place-items-center text-gray-500">Opening your workspace…</div>; if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />; if (roles && !roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />; return <Outlet />; }
