import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

// These tests use the real DB — they need DATABASE_URL set.
// Skip gracefully if not available.
const hasDb = Boolean(process.env.DATABASE_URL);
const describeIf = (cond: boolean) => (cond ? describe : describe.skip);

describeIf(hasDb)('Auth routes — smoke tests', () => {
  const uniqueEmail = () => `test-${Date.now()}@test.merrytales.co.ke`;

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });

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

  it('GET /api/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
