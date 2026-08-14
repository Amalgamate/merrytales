import { SubscriptionTier } from '@prisma/client';

export const MARKETPLACE_PLANS = {
  [SubscriptionTier.STARTER]: { priceKes: 100, listingLimit: 5, teamSeats: 1, commissionPercent: 5, features: ['shop profile', 'quotes', 'basic analytics'] },
  [SubscriptionTier.GROWTH]: { priceKes: 300, listingLimit: 25, teamSeats: 2, commissionPercent: 4, features: ['vendor packages', 'availability calendar', 'promotions', 'analytics'] },
  [SubscriptionTier.BUSINESS]: { priceKes: 600, listingLimit: 100, teamSeats: 5, commissionPercent: 3, features: ['bulk listing tools', 'multi-user shop', 'priority support', 'advanced analytics'] },
  [SubscriptionTier.PRO]: { priceKes: 1000, listingLimit: 500, teamSeats: 10, commissionPercent: 2.5, features: ['corporate RFQs', 'multi-branch tools', 'exports', 'integration access'] },
} as const;

export const PUBLICATION_REQUIRED_DOCUMENTS = [
  'IDENTITY',
  'BUSINESS_REGISTRATION',
  'KRA_PIN',
  'TAX_COMPLIANCE_CERTIFICATE',
  'ETIMS_PROOF',
  'BANK_OR_MPESA_PROOF',
] as const;
