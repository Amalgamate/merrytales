const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('merry_tales_access_token');
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const body = await response.json().catch(() => ({})) as { data: T; error?: { message?: string } };
  if (!response.ok) throw new ApiError(body.error?.message ?? 'Something went wrong.', response.status);
  return body.data;
}
