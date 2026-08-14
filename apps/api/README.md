# Merry Tales API

Kenya-first backend foundation for the Merry Tales marketplace and event workspace.

## Local setup

1. Run PostgreSQL and create a `merry_tales` database.
2. Copy `.env.example` to `.env` and replace `JWT_SECRET`.
3. Run `npm run db:generate --workspace=apps/api`.
4. Run `npm run db:migrate --workspace=apps/api -- --name initial`.
5. Optionally run `npm run db:seed --workspace=apps/api`.
6. Run `npm run dev --workspace=apps/api`.

The API is available at `http://localhost:3001/api`, with health at `/api/health`.

PostgreSQL is installed locally on this machine and reachable on port 5432. A PostgreSQL username/password is still required in `DATABASE_URL` before migrations can be applied; the repository does not store or guess database credentials.

## Implemented contracts

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST /api/events`
- `GET /api/events/:id`
- `GET /api/vendors`
- `GET /api/vendors/:slug`
- `GET|PATCH /api/vendors/account/me`
- `POST /api/leads`
- `GET /api/leads/vendor`
- `PATCH /api/leads/:id/status`
- `POST /api/leads/:id/messages`
- `GET /api/products` and `GET /api/products/:slug`
- `GET|POST /api/orders` and `GET /api/orders/:id`
- `GET /api/orders/vendor/fulfillments`
- `PATCH /api/orders/vendor/fulfillments/:id/status`
- `GET /api/finance/events/:eventId/summary`
- `POST /api/finance/events/:eventId/envelopes`
- `POST /api/finance/quotes`
- `PATCH /api/finance/quotes/:quoteId/status`
- `POST /api/finance/quotes/:quoteId/accept`
- `PATCH /api/finance/approvals/:approvalId`
- `GET|POST /api/commercial/vendor/quotes`
- `POST /api/commercial/vendor/quotes/:id/share`
- `POST /api/commercial/vendor/quotes/:id/invoice`
- `GET /api/commercial/vendor/invoices`
- `GET /api/commercial/review/:token`
- `POST /api/commercial/review/:token/decision`
- `GET /api/notifications`
- `POST /api/uploads`
- `POST /api/payments/mpesa/stk`
- `POST /api/payments/mpesa/callback`
- `GET /api/operations/admin/summary`
- `GET /api/operations/studio/jobs`

All protected endpoints require `Authorization: Bearer <access-token>`.

The seed credentials are intended for local development only:

- Customer: `couple@merrytales.co.ke`
- Vendor: `vendor@merrytales.co.ke`
- Password: `DemoMerryTales2026!`

## External services

- M-Pesa Daraja STK Push and callback processing are implemented. Add sandbox or production credentials from `.env.example` and expose the callback URL over HTTPS.
- Event Treasury balances are derived from immutable double-entry journals. Budget envelopes and commitments do not claim that money moved. The customer "Load money" action remains disabled until a licensed partner-backed funding flow is configured and reconciled.
- Vendor commercial documents use click-to-WhatsApp sharing with capability-scoped review links. Automatic outbound WhatsApp messages require a configured WhatsApp Business Platform account and approved templates outside Meta's customer-service window; they are not simulated by the API.
- Development uploads use `apps/api/uploads`. Production should mount durable storage or replace this adapter with S3/Cloudinary.
- Email and WhatsApp are represented by persisted notification channels; delivery providers still require account selection and credentials.

## Production checklist

- Set `NODE_ENV=production`, use a unique 32+ character `JWT_SECRET`, and restrict `WEB_ORIGIN` to the deployed HTTPS frontend.
- Run migrations against a managed PostgreSQL database with automated backups and point `DATABASE_URL` at its least-privilege application user.
- Configure Daraja credentials and an HTTPS `MPESA_CALLBACK_URL`, then test successful, cancelled, timed-out, and duplicate callbacks in sandbox before switching `MPESA_ENV=production`.
- Replace local uploads with durable object storage and malware/type validation before accepting public uploads.
- Connect an email provider for verification and password recovery; never expose reset tokens in API responses or logs.
- Put the API behind a trusted reverse proxy, preserve real client IPs, add request/error monitoring, and alert on payment callback failures.

## Local database

This workspace currently has an isolated development PostgreSQL cluster in `.local/postgres-data` listening on `127.0.0.1:5433`. It was initialized only for local development and uses trust authentication on loopback. Never deploy that configuration.

Start it after a reboot with:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D '.local\postgres-data' -l '.local\postgres.log' -o '-p 5433 -h 127.0.0.1' start
```
