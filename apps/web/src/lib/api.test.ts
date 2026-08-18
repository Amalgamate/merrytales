import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, ApiError } from './api';

describe('apiRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  it('returns parsed data on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '1', name: 'Test' } }),
    } as Response);

    const result = await apiRequest<{ id: string; name: string }>('/test');
    expect(result).toEqual({ id: '1', name: 'Test' });
  });

  it('throws ApiError on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'Not found' } }),
    } as Response);

    await expect(apiRequest('/missing')).rejects.toThrow(ApiError);
  });

  it('includes Authorization header when token exists', async () => {
    localStorage.setItem('merry_tales_access_token', 'test-token');
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    await apiRequest('/secure');
    const call = vi.mocked(fetch).mock.calls[0];
    const headers = (call[1] as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-token');
  });
});
