1) Tech stack

Framework: Next.js 15 (App Router), React 19, TypeScript

Styling: Tailwind CSS 4

Runtime & hosting: Vercel (Serverless Route for /api/reviews/hostaway)

Data: Hostaway API (mocked JSON file, switchable via env)

Lint/Build: ESLint (explicit-any check disabled for build stability on Vercel)


2) Local setup

git clone https://github.com/Habibeyilmazz/flexliving-reviews-dashboard.git
cd flexliving-reviews-dashboard

# optional: create .env.local
# REVIEW_USE_MOCK=1  # forces mock data on API route (recommended)

npm i
npm run dev
# Open http://localhost:3000

Key routes
Manager Dashboard: /

Property page (slug): /property/Canary-Wharf-Studio (use slugs from mock data)

API (serverless): /api/reviews/hostaway?limit=100&listing=<slug-or-name>

3) Data model & normalization
Normalized review (UI-facing)

type NormalizedReview = {
  reviewId: number;
  status: 'published' | 'pending' | 'hidden' | 'rejected'; // vendor status
  type: 'guest-to-host' | 'host-to-guest';                  // direction
  channel: 'flex' | 'google';                               // origin
  listingId: string;          // slug (e.g., '2B-N1A-29-Shoreditch-Heights')
  listingName: string;        // human name
  submittedAt: string;        // ISO-like date
  ratingOverall: number | null;   // 0–10 or null
  categories?: Record<string, number>; // e.g. cleanliness, noise, value
  guestName?: string;
  text: string;
};

Normalization rules:

Convert vendor fields (reviewCategory) to a categories map.

Compute ratingOverall from vendor rating or average of categories if missing.

Force listingId to a URL-safe slug.

Keep status (only published reviews are eligible for public display).

Keep type (public property page shows guest-to-host only).

4) API behavior

Route: GET /api/reviews/hostaway

Query params:

limit (number)

listing (slug or human name; server matches both)

Environment flag:

REVIEW_USE_MOCK=1 → serve bundled JSON at src/data/hostaway-mock.json

unset/0 → attempt live Hostaway (sandbox has no data; we still handle empty)

Response shape:
{
  "status": "success",
  "result": [ /* NormalizedReview[] */ ],
  "count": 12
}


5) Manager Dashboard – UX decisions

Goals: Give managers insight & control over what goes public.

Filters: listing, channel, category, time window, sort (newest/oldest/rating).

Search: text/guest/listing fuzzy filter.

Approvals: toggle per-review; persisted in localStorage as { [reviewId]: true }.

Insights:

Avg rating (approved): average of approved & published reviews.

Approved count: approved out of total visible.

Top issues: lowest average category scores across approved items.

Links: “View property page →” for quick check of public view.

Why localStorage for approvals?
Assessment requested a mock/sandbox solution. A real build would persist approvals server-side.

6) Property (public) page

Layout mimics Flex property detail: hero grid, “About”, “Amenities”, “Policies”, Guest Reviews.

What is shown: Only published & manager-approved & guest-to-host reviews.

Average rating: shows 5-star visual + (avg X/10 from approved).

Empty states: Loading, error, and “No approved reviews yet”.

7) Google Reviews – findings (no implementation)

Feasibility:

Google Places API can return review snippets for some endpoints, but full review text access is limited and can change; T&Cs restrict caching/long-term storage and require linking & branding.

Mapping each Flex listing → a Place ID is non-trivial (address/name disambiguation, duplicates).

Billing/quotas apply; needs project + key + usage monitoring.

Decision: Not included in this submission to avoid T&C and scoping risks.

If pursued later: store only allowed fields with required attributions; add a “channel=google” flag; surface it in the dashboard like other channels with a visual badge.

8) Deployment notes

Hosted on Vercel; default Next.js preset.

Env: set REVIEW_USE_MOCK=1 for deterministic demo.

ESLint rule @typescript-eslint/no-explicit-any disabled in .eslintrc.json for CI build stability; local dev keeps type checks tight in TS files.

9) Testing script (manual)

Open / → confirm mock reviews load and summary tiles populate.

Toggle Only approved → list shrinks to approved.

Approve a few items; watch Avg rating and Top issues update.

Click View property page → → confirm those approved published guest-to-host reviews appear.

Change filters (channel/category/time/sort) and validate results.

Hard refresh → approvals persist (localStorage).

10) Known limitations & future work

Approvals persist per-browser (localStorage). Real app should use DB & auth.

No pagination (mock fits in-memory).

No live Hostaway auth in this demo; the adapter is ready to plug a token.

Google Reviews integration deferred (see findings).

Accessibility pass (ARIA for filters/cards) can be deepened.