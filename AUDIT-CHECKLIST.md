# Merry Tales — Audit Fix Checklist

> **How this works:** When a task is done, change `- [ ]` to `- [x]`.
> Grouped by priority. Work top to bottom.

---

## 🔴 Critical — Fix Before Any Real Traffic

### 1. M-Pesa Callback Security
- [x] Add Safaricom IP allowlist middleware on `POST /api/payments/mpesa/callback`
- [x] Verify timestamp staleness (> 5 min = skip processing) from the callback body before processing payment
- [x] Wrap `handleSuccessfulPayment` in try/catch so Safaricom gets `ResultCode: 0` regardless — no double processing

### 2. Frontend → API Disconnect (Shop & Vendors pages are fake)
- [x] `Shop.tsx` already uses `fetchProducts()` from `lib/marketplace.ts` → real API ✅
- [x] `Vendors.tsx` already uses `fetchVendors()` from `lib/marketplace.ts` → real API ✅
- [x] `VendorProfile.tsx` already uses `fetchVendor(slug)` → real API ✅
- [x] `ProductDetail.tsx` already uses `fetchProduct(slug)` → real API ✅
- [x] Static data files (`vendors.ts`, `products.ts`) are not used by those pages

### 3. Checkout is Broken (fake IDs p1–p15 don't exist in DB)
- [x] Cart stores real DB product slugs/IDs from API (ProductDetail uses `product.id` from API response)
- [x] Orders API accepts both `id` and `slug` in product lookup — confirmed in orders.ts
- [x] Delivery fee calculation now reads from `SystemSetting` key `delivery_fees` with hardcoded fallback

### 4. Session Expiry — No Refresh Token Flow
- [x] Add `POST /api/auth/refresh` endpoint — rotates token, sets new HttpOnly cookie
- [x] Add `POST /api/auth/logout` endpoint — revokes all DB refresh tokens, clears cookie
- [x] On login/register, create `RefreshToken` record and set `mt_refresh` HttpOnly cookie
- [x] Frontend `apiRequest()` includes `credentials: 'include'` so cookie is sent
- [x] `AuthContext` silently retries `/auth/refresh` on 401, stores new access token, retries `/auth/me`
- [x] `signOut()` calls `POST /auth/logout` to revoke server-side tokens

### 5. Seed Overwrites Superadmin Password
- [x] `superadmin@merrytales.co.ke` upsert changed to `update: {}` — never overwrites password
- [x] `admin@merrytales.co.ke` upsert changed to `update: { role: UserRole.ADMIN }` only
- [x] `staff@merrytales.co.ke` and `studio@merrytales.co.ke` have `mustChangePassword: true` in create + update
- [x] Warning comment added: "DEVELOPMENT SEED ONLY — do NOT run against production"
- [x] Marketplace vendor loop: removed `passwordHash` from `update` object

---

## 🟠 High Priority

### 6. Forgot / Reset Password Flow
- [x] `POST /api/auth/forgot-password` — generates SHA-256 hashed token, stores on User, sends Resend email
- [x] `POST /api/auth/reset-password` — validates token hash + expiry, updates password, clears token
- [x] Rate limit added to `/api/auth/forgot-password` (5 req/hour)
- [x] `ForgotPassword.tsx` page created at `/forgot-password`
- [x] `ResetPassword.tsx` page created at `/reset-password?token=...`
- [x] "Forgot password?" link added to `Login.tsx`
- [x] Both routes registered in `App.tsx`

### 7. Communication Queue Never Fires
- [x] Build a background worker (setInterval or BullMQ) that polls `CommunicationDelivery` records with status `QUEUED`
- [x] Worker calls appropriate provider (Resend for email, MobileSasa for SMS) and updates `status`
- [x] Add retry logic using `retryCount` / `retryAfter` schema fields
- [x] Start the worker when the API server starts

### 8. Admin Listing Moderation — Write Endpoints
- [x] `GET /api/operations/admin/listings` — paginated listing with moderation status filter
- [x] `PATCH /api/operations/admin/listings/:id` — approve/reject/suspend with vendor notification
- [x] Approve / Reject / Request Changes buttons wired in AdminDashboard (`decideListing` function calls `POST /operations/admin/listings/:id/decision`)

### 9. Guest Management API — Schema Exists, Zero Routes
- [x] `GET /api/events/:id/guests` — list all guests for an event
- [x] `POST /api/events/:id/guests` — create a guest
- [x] `PATCH /api/events/:id/guests/:guestId` — update RSVP / dietary / seating
- [x] `DELETE /api/events/:id/guests/:guestId` — remove a guest
- [x] Add a basic GuestList component in the Customer app (under Event Overview or Guests tab)

### 10. Separate MOBILESASA_ENCRYPTION_KEY from JWT_SECRET
- [x] `MOBILESASA_ENCRYPTION_KEY` throws clear error if not configured (no fallback to JWT_SECRET)
- [x] Update `.env.production.example` with `MOBILESASA_ENCRYPTION_KEY=` entry

### 11. Event PATCH & DELETE Endpoints
- [x] `PATCH /api/events/:id` — update title, date, venue, budget, traditions, etc.
- [x] `DELETE /api/events/:id` — deletes event (owner-scoped)
- [x] Add Edit Event button/form in the Customer app (WeddingOverview / Dashboard)

### 12. RefreshToken Model is Unused
- [x] Covered by task #4 above — refresh flow fully implemented

---

## 🟡 Medium — Hardcoded Values Made Dynamic

### 13. Delivery Fees — Hardcoded Object in orders.ts
- [x] `orders.ts` reads from `SystemSetting` key `delivery_fees` at order creation
- [x] Falls back to `{ Nairobi: 500, Kiambu: 700, Mombasa: 1200, default: 1000 }` if not set
- [x] Add seeder entry for `delivery_fees` SystemSetting
- [x] Editable "Delivery Fees" card added to SystemControlsPanel — per-county inputs + Save button

### 14. Referral Reward Amounts — Magic Numbers in payments.ts
- [x] `payments.ts` reads referrer/referee amounts from `SystemSetting` keys with fallbacks (500/300)
- [x] Expiry days read from `SystemSetting` key `referral_credit_expiry_days` (fallback: 180)
- [x] Same expiry fix applied in `events.ts` PLAN_COMPLETION referral section
- [x] Seed `SystemSetting` records for referral reward keys

### 15. OpenAI Model Name is Wrong
- [x] `assistant.ts` uses `process.env.OPENAI_MODEL ?? 'gpt-4o'` — no more fake model name
- [x] `OPENAI_MODEL` added to `config.ts` as optional

### 16. WEB_ORIGIN — Only First Origin Used for Quote Links
- [x] Add dedicated `WEB_ORIGIN` env var (single primary web URL) to config.ts
- [x] Update `commercial.ts` to use it instead of `allowedOrigins[0]`

### 17. Marketplace Category Taxonomy — Duplicated Frontend/Backend
- [x] `GET /api/products/categories` already exists in products router
- [x] Created `src/hooks/useMarketplaceCategories.ts` — fetches from API with in-memory cache
- [x] `Vendors.tsx` now uses the hook instead of static data
- [x] `src/data/marketplace.ts` marked deprecated with comment (kept for type compatibility)

### 18. Stories — Hardcoded Static Data
- [x] Stories seeded as `SystemSetting` key `stories` (JSON array) in `prisma/seed.ts`
- [x] `GET /api/stories` and `GET /api/stories/:slug` endpoints created (`routes/stories.ts`)
- [x] Mounted in `app.ts` at `/api/stories`
- [x] `Stories.tsx` fetches from API with loading spinner — static `data/stories.ts` import removed

---

## 🔵 Security & Validation Improvements

### 19. File Upload MIME Validation — Client-Supplied Type
- [x] `file-type@16` installed (CJS-compatible), `fromBuffer` used to read magic bytes
- [x] Uploads use `multer.memoryStorage()` — file written to disk only after validation passes
- [x] Client-supplied `mimetype` used only as fallback for magic-byte-less formats (e.g. SVG)

### 20. POST /api/leads — No Auth, No Rate Limit
- [x] Rate limit added: 5 requests per 15 min per IP
- [x] Vendor existence check added before creating lead
- [x] Contact required validation: at least email or phone must be provided

### 21. Admin Endpoints — No Pagination
- [x] Add `page` / `pageSize` to `GET /api/operations/admin/users`
- [x] Add `page` / `pageSize` + date range filters to `GET /api/operations/admin/audit`
- [x] Update admin frontend panels for paginated responses

### 22. Email Verification on Registration
- [x] Prisma migration applied — `emailVerified`, `emailVerifyToken`, `emailVerifyExpiresAt` on User model
- [x] `POST /api/auth/register` sends 24-hour verification email if `RESEND_API_KEY` is set (non-blocking)
- [x] `POST /api/auth/verify-email` endpoint added — validates token hash, marks `emailVerified: true`
- [x] `POST /api/auth/resend-verification` endpoint added — rate limited (3/hr), re-sends verification email
- [x] `VerifyEmail.tsx` page created at `/verify-email` with loading/success/error states
- [x] Route registered in `App.tsx`
- [x] `emailVerified` field added to `publicUser` select and `AuthUser` interface
- [x] Unverified banner shown in Customer app Dashboard with "Resend verification" button

### 23. requireAuth DB Lookup on Every Request
- [x] `status` and `mustChangePassword` embedded in JWT payload (`st` and `mcp` claims)
- [x] `requireAuth` middleware reads from JWT — no DB round-trip per request
- [x] `db` import removed from `middleware/auth.ts`
- [x] All `signAccessToken` call sites updated to pass `status` and `mustChangePassword`

---

## ⚪ Test Coverage

### 24. Zero Tests — Set Up Testing Infrastructure
- [x] Added `vitest` to `apps/api` and `apps/web` with coverage via `@vitest/coverage-v8`
- [x] Test scripts added to both `package.json` files (`test`, `test:watch`, `test:coverage`)
- [x] Root `package.json` test script propagates to all workspaces
- [x] Smoke tests for auth routes in `tests/auth.test.ts` (gracefully skipped if no DB)
- [x] Unit tests for M-Pesa callback with mocked DB in `tests/payments.unit.test.ts`
- [x] Property-based tests with `fast-check` for order total calculations in `tests/orders.property.test.ts`
- [x] Property-based tests for referral credit expiry calculations in `tests/referrals.property.test.ts`
- [x] Frontend unit tests for `apiRequest` / `ApiError` in `src/lib/api.test.ts`
- [x] GitHub Actions `test` job added — runs before deploy, both API and web tests

---

## ✅ Summary

**All 24 groups fully completed — 80+ individual checkboxes done.**

**Last updated:** Final wave — remaining items (stories API, auth caching, email verification banner, resend verification endpoint) + full test infrastructure (vitest, property-based tests, GitHub Actions CI)
