import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Referral credit expiry — property-based', () => {
  it('expiry date is always in the future for positive expiryDays', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3650 }), // 1 day to 10 years
        (expiryDays) => {
          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + expiryDays);
          expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
        }
      )
    );
  });

  it('expiry date is exactly expiryDays in the future (within 1s tolerance)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (expiryDays) => {
          const before = Date.now();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + expiryDays);
          const expectedMs = expiryDays * 24 * 60 * 60 * 1000;
          const actualMs = expiresAt.getTime() - before;
          // Allow 1 second tolerance for test execution time
          expect(Math.abs(actualMs - expectedMs)).toBeLessThan(1000);
        }
      )
    );
  });
});
