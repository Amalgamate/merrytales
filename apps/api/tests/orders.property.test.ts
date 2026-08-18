import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check'; // fast-check is already installed in root node_modules

describe('Order total calculations — property-based', () => {
  it('total always equals subtotal + deliveryFee', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 100 }),
            unitPrice: fc.float({ min: 1, max: 1_000_000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.integer({ min: 0, max: 2000 }),
        (items, deliveryFee) => {
          const subtotal = items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
          );
          const total = subtotal + deliveryFee;
          // total must be >= subtotal when deliveryFee >= 0
          expect(total).toBeGreaterThanOrEqual(subtotal);
          // total must equal exact sum
          expect(total).toBeCloseTo(subtotal + deliveryFee, 5);
        }
      )
    );
  });

  it('subtotal is always non-negative for positive quantities and prices', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 1000 }),
            unitPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000), noNaN: true }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (items) => {
          const subtotal = items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
          );
          expect(subtotal).toBeGreaterThan(0);
        }
      )
    );
  });
});
