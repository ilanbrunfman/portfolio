# Portfolio

[![Server tests](https://github.com/ilanbrunfman/portfolio/actions/workflows/server-tests.yml/badge.svg?branch=feature/bank-tracker)](https://github.com/ilanbrunfman/portfolio/actions/workflows/server-tests.yml)
[![Client checks](https://github.com/ilanbrunfman/portfolio/actions/workflows/client-checks.yml/badge.svg?branch=feature/bank-tracker)](https://github.com/ilanbrunfman/portfolio/actions/workflows/client-checks.yml)

## Bank tracker (`/bank`)

A full-stack app to track bank accounts: balances, transactions, transfers
between accounts, filters and a monthly summary, behind an email + password
login. It runs locally: the React app talks to an Express API, which stores
everything in PostgreSQL running in Docker.

**Stack:** React 19 + Vite · Node 24 + Express 5 · Prisma 7 · PostgreSQL 17
(Docker) · Zod validation · Vitest + Supertest (43 API tests) · GitHub Actions

![Overview: total balance, account cards and the monthly summary](docs/screenshots/bank-overview.png)

| Account page | Adding a transaction |
|---|---|
| ![Account page with filters and running balances](docs/screenshots/bank-account.png) | ![New transaction form](docs/screenshots/bank-transaction-form.png) |

<p>
  <img src="docs/screenshots/bank-phone-overview.png" alt="Overview on a phone" width="260">
  &nbsp;
  <img src="docs/screenshots/bank-phone-account.png" alt="Account page on a phone" width="260">
  &nbsp;
  <img src="docs/screenshots/bank-login.png" alt="Login screen" width="420">
</p>

### What it does

- **Accounts** (checking, savings, credit card, cash) with balances computed in
  the database; archive and restore.
- **Transactions** with categories and notes; each row shows the balance after
  it (SQL window function), loaded 50 at a time.
- **Transfers** between accounts, saved inside a database transaction so both
  sides are written together or not at all.
- **Search and filters** (type, category, date range) and a **monthly summary**
  with spending by category and a 6-month chart.
- **Login** with hashed passwords and an httpOnly session cookie; every query
  is limited to the logged-in user's own data.
- **Responsive**: side navigation on desktop and tablet, a bottom bar on phones.

### Run it on your machine

Needs Docker Desktop and [nvm](https://github.com/nvm-sh/nvm).

```bash
# 1. API + database (Node 24)
cd server
cp .env.example .env        # then set a real POSTGRES_PASSWORD (also inside DATABASE_URL)
docker compose up -d        # PostgreSQL on localhost:5433
nvm use && npm install
npm run db:migrate
npm run db:seed             # demo data
npm run dev                 # API on http://localhost:4000

# 2. React app (Node 20), in a second terminal
cd client
nvm use 20 && npm install
npm run dev                 # open the printed URL + /bank
```

Log in as **demo@bank.test / demo1234**, or sign up for an empty account.

### Where things are

| Path | What |
|---|---|
| `client/src/pages/bank/` | React pages, components, contexts and hooks for `/bank` |
| `server/src/` | Express app: routes, Zod schemas, services, middleware |
| `server/prisma/` | Database schema, migrations and the seed script |
| `server/test/` | API tests (`npm test` in `server/`, uses its own `bank_test` database) |
| `server/README.md` | Every endpoint, the login design, and all commands |

---
