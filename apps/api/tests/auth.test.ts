import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

// Auth smoke tests require a real database connection.
// They are skipped in CI unless DATABASE_URL points to a live DB
// (i.e. not the stub value injected by tests/setup.ts).
const stubDbUrl = 'postgresql://test:test@localhost:5432/test_db';
const hasRealDb = Boolean(process.env.DATABASE_URL) && process.env.DATABASE_URL !== stubDbUrl;
const describeWithDb = hasRealDb ? describe : describe.skip;

// Health check has no DB dependency — always runs.
describe('Health check', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});

// Token / auth endpoint that needs no DB
describe('Auth routes — no DB required', () => {
  it('GET /api/auth/me returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

// These tests need a real connected database — skipped in CI without one.
describeWithDb('Auth routes — DB smoke tests', () => {
  const uniqueEmail = () => `test-${Date.now()}@test.merrytales.co.ke`;

  it('POST /api/auth/register creates a user and returns a token', async () => {
    const email = uniqueEmail();
    const res = await request(app).post('/api/auth/register').send({
      email,
      phone: `+2547${Math.floor(10000000 + Math.random() * 89999999)}`,
      password: 'StrongPassword123!',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe(email);
  });

  it('POST /api/auth/login returns token for valid credentials', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/register').send({
      email,
      phone: `+2547${Math.floor(10000000 + Math.random() * 89999999)}`,
      password: 'StrongPassword123!',
      firstName: 'Login',
      lastName: 'Test',
    });
    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'StrongPassword123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('POST /api/auth/login returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'notreal@test.merrytales.co.ke',
      password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/auth/forgot-password always returns 200', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'doesnotexist@test.merrytales.co.ke',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
  });
});
