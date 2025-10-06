# FlexLiving Reviews Dashboard

A small, full-stack demo that ingests (mocked) Hostaway reviews, optionally blends Google Reviews, lets managers **approve** reviews in a dashboard, and renders **approved guest reviews only** on a Flex-style property page.

---

## ✨ Highlights

- **Next.js (App Router) + TypeScript + Tailwind**
- **Normalized review model** across sources (Hostaway + optional Google)
- **Manager Dashboard**
  - Filter by listing, channel, category, time window
  - Search + sort (per-review rating and per-listing average)
  - Approve / unapprove; quick link to property page
  - “Top issues” from category scores
- **Property Page (Flex look & feel)**
  - Only approved **guest→host** reviews
  - Approved average (0–10) with 5-star display
- **Hostaway adapter (mocked)**
  - Sandbox has no reviews; ships realistic JSON and a normalizer
- **Google Reviews (exploration)**
  - Optional Place Details integration; normalized & cached

---

## 🧱 Tech Stack

- **Framework:** Next.js (App Router), React 18, TypeScript  
- **Styling:** Tailwind CSS  
- **API:** Next.js Route Handlers (`/app/api/**`)  
- **State:** Local component state; approvals stored in `localStorage` for demo  
- **Deploy:** Vercel

---

## 🚀 Quick Start
```bash
# clone (public repo)
git clone https://github.com/Habibeyilmazz/flexliving-reviews-dashboard.git
cd flexliving-reviews-dashboard

# install
npm i

# env
cp .env.example .env.local   # then edit .env.local (see below)

# dev
npm run dev
# open http://localhost:3000


Environment Variables
Create .env.local (or set on Vercel). The app runs fully with mocks — no secrets required.

🧩 Features
Manager Dashboard

Filters: listing, review type (guest→host default), channel (Google/Flex), category, time (All / 30d / 90d), “Only approved”

Sort: newest/oldest, highest/lowest rating (per-review), highest/lowest listing average

Insights: listing averages (guest perspective), Top issues (lowest-avg categories across approved)

Actions: approve/unapprove (demo via localStorage), View property page → link

Search: guest name / text / listing

Property Page (public)

Flex-style layout (green header, cards)

Only approved + guest→host + published reviews

Approved average and star display

Friendly empty state