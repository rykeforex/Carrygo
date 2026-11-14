# CarryGo

On-demand waste pickup marketplace for Ghana. React 18 + Vite 7 + Supabase.
**Status: Phase 4 of 7 complete (live GPS tracking). Not production-ready yet — see "What is real vs simulated".**

## What is real vs simulated

| Area | Status |
|---|---|
| Database schema, constraints, RLS, server-side pricing, atomic job acceptance, status state machine, location rules, audit log | **Real** — applied to Supabase project `zbgeqsjraxxqpztfmxuk`, 49 automated RLS/logic checks passed |
| Sign up / sign in / sign out / password reset, role from the database | **Real** (Supabase Auth). Email confirmation must be enabled in the dashboard — see below |
| Customer booking (address + GPS/pin, server-priced quote, scheduling, idempotent create), pickup history, status tracking with realtime updates, cancellation, ratings, support reports, profile, in-app notifications | **Real** (Phase 2) — persisted in Supabase |
| Live collector location on the customer's map, with a real Google driving route/ETA when available (otherwise a labelled straight-line distance and no ETA), stale-signal detection | **Real** (Phase 4) |
| Collector onboarding (private ID-document upload), admin review screen (approve / reject / suspend with notes, audit-logged), go online/offline, nearby jobs, atomic accept, release, status steps, job history, ratings, earnings *estimate* | **Real** (Phase 3) |
| Collector GPS sharing (explicit consent, only while en route/arrived, auto-stops, retries on bad network, screen wake-lock) | **Real** (Phase 4) |
| Earnings / payouts | **Estimates only**, using the unapproved 20% placeholder commission. No money moves until Phase 5 |
| Payments, full admin console (pricing, revenue, analytics, reports) | **Not built yet** (Phases 5–6). A minimal admin screen exists for collector review only |

## Run locally

Requires Node 20.19+ or 22.12+.

    # a ready-made .env (public Supabase values) is included; it is a hidden file. Add a Google Maps key to it if you have one.
    # If you ever see "Backend not configured": the .env file is missing/misnamed, or the dev server wasn't restarted after creating it.
    npm install
    npm run dev

## One-time human configuration (Supabase dashboard)

1. **Authentication → Providers → Email:** enable *Confirm email*; set a minimum password length of 8+ and enable leaked-password protection if your plan offers it.
2. **Authentication → URL Configuration:** set *Site URL* to your production domain and add `http://localhost:5173` and the production URL to *Redirect URLs* (needed for confirmation and password-reset links).
3. **Authentication → SMTP:** configure a real SMTP provider before launch (the default mailer is heavily rate-limited and not for production).
4. **Create the first administrator** (cannot be done from the app, by design). After signing up normally, run in the SQL editor:

       update public.profiles set role = 'admin'
       where id = (select id from auth.users where email = 'YOU@EXAMPLE.COM');

## Security model (summary)

- Browser holds only the Supabase URL and *publishable* key. No service-role key exists in this codebase; Edge Functions (Phase 5) will read secrets from Supabase's secret store.
- Every table has RLS. Browsers have **read-only** access to business tables; all writes go through `SECURITY DEFINER` RPCs that check `auth.uid()`, role and state.
- `profiles.role` / `is_suspended` are not writable from the browser (column-level grants); roles change only via admin RPCs or the DB owner.
- Prices are computed server-side (`create_pickup`); clients cannot submit a price. A quoted price is immutable after booking.
- Collectors never see unassigned jobs' addresses — only coarse (≈1 km) locations via `list_open_pickups`.
- Collector ID documents live in a private bucket; collectors' `id_document_path` / `review_notes` columns are not readable by customers.
- Job acceptance is a single atomic `UPDATE … WHERE status='requested' AND collector_id IS NULL`; a partial unique index limits each collector to one active job.

## Database

Migrations are recorded in the Supabase project history (`p1_core_schema`, `p1_rls_policies`, `p1_rpc_functions`). To export them as files: `supabase link --project-ref zbgeqsjraxxqpztfmxuk && supabase db pull`.

## Tests

    npm test      # vitest: format/errors/schedule unit tests + BookingFlow behaviour tests (no success shown before backend confirms; retry reuses the idempotency key; price-changed re-confirmation; location required)

Database behaviour (RLS, atomic acceptance, idempotency, price guard) was verified against the live project with role-impersonating SQL tests (Phase 1: 49 checks, Phase 2: 11 checks), run inside rolled-back transactions. Those SQL tests are not yet committed as files; Phase 7 adds a repeatable suite and a true parallel-acceptance race test.

## Concurrency test

`npm run test:race` fires two collectors at `accept_pickup` simultaneously over separate HTTP connections, repeatedly, and fails if any round has anything other than exactly one winner. It needs one customer and two approved collector accounts (see the header of `scripts/race-accept.mjs`) and should be run against staging, because it creates real pickups. It has NOT been run yet.

## Collector rules currently implemented (need your approval)

- Collectors upload one ID document (Ghana Card, driver's licence or passport; PDF/JPG/PNG, max 5 MB) to a private bucket. Which documents are *required*, and the review standard, are business decisions that are still open.
- An admin must approve every collector; approval is never automatic. There is no "verified" badge anywhere in the app.
- One active job per collector. A job can be released only before the collector starts driving. Going offline is blocked during an active job.
- Collectors see only an approximate location (~1 km) until they accept; customer name/phone are visible only while the job is active; history keeps neither.
- Location sharing is opt-in per device (asked the first time a collector taps Start driving; switchable at any time), runs only while a job is `en_route` or `arrived`, and the server rejects reports outside those states. Only the latest position is stored (no route history) and it is deleted when the job leaves those states. Whether sharing should be *mandatory* is a business decision that is still open.

## Booking rules currently implemented (need your approval)

- A customer can cancel while a pickup is `requested` or `assigned`; once the collector is `en_route` online cancellation is blocked. No cancellation fee is charged. Refund/fee rules are undecided.
- Max 5 open pickups per customer; scheduled pickups need 30 min notice and at most 30 days.
- No payment is taken yet (Phase 5).
- Approved collectors cannot book pickups with the same account (they use a customer account).

## Placeholders needing business approval

Seeded prices (`pricing_config`) and the 20% commission (`platform_settings.commission_bps`) are **unapproved placeholders** (`is_approved = false`). Cancellation/refund/payout rules, payment provider, collector verification process and company ownership (`src/config/brand.js`, `ownershipConfirmed: false`) are still to be decided. The Terms and Privacy pages are drafts pending Ghanaian legal review.

## Roadmap

0 ✔ hygiene · 1 ✔ foundation + auth · 2 customer bookings · 3 collector flow · 4 live GPS · 5 payments + notifications · 6 admin console · 7 tests, security review, deployment docs

## Admin access

There is no separate admin URL. On the start screen choose **Staff sign in** (or sign in through either portal) with an account whose role is `admin`; the app routes you to the admin screen automatically. Admins cannot be created from the app. Create the account normally (customer sign-up), then promote it once in the Supabase SQL editor:

    update public.profiles set role = 'admin'
    where id = (select id from auth.users where email = 'YOU@EXAMPLE.COM');

Today the admin screen covers **collector applications only** (view the uploaded ID document, approve / reject / suspend with notes; every decision is audit-logged). Pricing, payments, revenue, complaints, analytics and exports are Phase 6. An admin account cannot book pickups.

## Deploy to Vercel

1. Put the project in a Git repository and push it to GitHub (`.env` is git-ignored — keep it that way).
2. In Vercel: **Add New → Project → Import** the repository. Framework preset **Vite** (detected), build command `npm run build`, output directory `dist`. Set **Node.js Version** to 22.x (Project → Settings → General).
3. Project → Settings → **Environment Variables** (Production and Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_GOOGLE_MAPS_API_KEY`. Vite bakes these in at build time, so **redeploy after changing them**.
4. Deploy. Note your URL (e.g. `https://carrygo.vercel.app`).
5. **Supabase → Authentication → URL Configuration:** set *Site URL* to your production URL and add it (and `http://localhost:5173`) to *Redirect URLs*. Without this, confirmation and password-reset emails point to the wrong place.
6. **Google Cloud → your Maps key → Application restrictions → Websites:** add `https://YOUR-DOMAIN/*` and `http://localhost:5173/*`. Enable **Maps JavaScript API**, **Geocoding API** (address search) and **Directions API** (real ETA). Without Directions the app simply shows no ETA.
7. Custom domain: Project → Settings → Domains. HTTPS is automatic. Update steps 5 and 6 to the new domain.
8. Security headers are set in `vercel.json`. The Content-Security-Policy ships in **Report-Only** mode so it cannot break the map: open the browser console on the live site, confirm there are no CSP violation reports during sign-in, booking and the map, then rename the header to `Content-Security-Policy` to enforce it.

CLI alternative: `npx vercel` (preview) then `npx vercel --prod`.
