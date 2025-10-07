# Running the project

## Deployed
Vercel (Production): flexliving-reviews-dashboard-bs42.vercel.app

## Local
Requirements: Node 18+

1. git clone https://github.com/Habibeyilmazz/flexliving-reviews-dashboard.git
2. cd flexliving-reviews-dashboard
3. cp .env.example .env.local
4. npm i
5. npm run dev
6. Open http://localhost:3000

### Routes
- Dashboard: /
- Property page (example): /property/Canary-Wharf-Studio
- API (serverless): /api/reviews/hostaway?limit=100&listing=Canary-Wharf-Studio
