import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module before any imports that use it
vi.mock('../src/db', () => ({
  db: {
    payment: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue(null), // No payment found = skip processing
    },
  },
}));

vi.mock('../src/services/mpesa', () => ({
  initiateStkPush: vi.fn(),
}));

vi.mock('../src/middleware/mpesa', () => ({
  requireMpesaIp: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import request from 'supertest';
import { app } from '../src/app';

describe('M-Pesa callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ResultCode 0 for missing CheckoutRequestID', async () => {
    const res = await request(app)
      .post('/api/payments/mpesa/callback')
      .send({ Body: { stkCallback: {} } });
    expect(res.status).toBe(200);
    expect(res.body.ResultCode).toBe(0);
  });

  it('returns ResultCode 0 for valid callback structure', async () => {
    const res = await request(app)
      .post('/api/payments/mpesa/callback')
      .send({
        Body: {
          stkCallback: {
            CheckoutRequestID: 'ws_CO_123456',
            ResultCode: 1, // failed payment
            Timestamp: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
          },
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.ResultCode).toBe(0);
  });
});
