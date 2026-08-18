// Test environment setup — runs before any test file is imported.
// Provides the minimum env vars required by src/config.ts so the Zod
// schema doesn't throw when the app module is loaded during unit tests.
// These values are intentionally fake; no real DB or secrets are needed.

process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-at-least-32-characters-long!!';
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.MPESA_ENV = process.env.MPESA_ENV ?? 'sandbox';
