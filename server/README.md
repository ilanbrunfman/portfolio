# Server

Express API for the bank tracker (`/bank` in the client).

## Run it

Needs Docker Desktop running (for the database).

```bash
cp .env.example .env   # first time only – then set a real POSTGRES_PASSWORD
                       # (and the same password inside DATABASE_URL)
docker compose up -d   # start PostgreSQL on localhost:5433
nvm use                # Node 24 (from .nvmrc) – the client stays on Node 20
npm install            # also generates the Prisma client
npm run db:migrate     # create/update the tables
npm run db:seed        # optional: demo data, log in as demo@bank.test / demo1234
npm run dev            # http://localhost:4000, restarts on file changes
```

## Production (Render + Neon)

`render.yaml` (repo root) describes the API service for Render: root folder
`server`, build `npm ci`, start `npm run start:prod` (applies new migrations
with `prisma migrate deploy`, then starts Express), health check
`/api/health`, `NODE_ENV=production`. `DATABASE_URL` (the Neon connection
string) is entered in Render's dashboard, never committed.

- `npm start` / `start:prod` load `.env` only if it exists (`--env-file-if-exists`);
  on Render the variables come from its settings instead.
- `prisma` is a regular dependency, because production installs skip dev
  packages and `migrate deploy` needs it.
- In production the session cookie is `Secure` (HTTPS only) and Express
  trusts the host's proxy.

## Database (Docker)

| Command | What it does |
|---------|--------------|
| `docker compose up -d` | Start Postgres in the background |
| `docker compose down` | Stop it (data is kept in the `bank-db` volume) |
| `docker compose down -v` | Stop it **and delete all data** |
| `docker compose logs -f db` | Follow the database logs |

Port 5433 is used because 5432 is often taken by a Postgres installed on the
machine. It only listens on localhost.

## Prisma (tables and queries)

The tables are described in `prisma/schema.prisma`. Prisma turns changes into
SQL migration files (`prisma/migrations/`, committed) and generates a typed
client in `src/generated/prisma/` (not committed, rebuilt on `npm install`).

| Command | What it does |
|---------|--------------|
| `npm run db:migrate` | After editing the schema: write a migration, apply it, regenerate the client |
| `npm run db:generate` | Regenerate the client only |
| `npm run db:seed` | Replace all rows with demo data (**deletes existing rows**) |
| `npm run db:reset` | Drop everything, re-run all migrations, then seed (**deletes data**) |
| `npm run db:studio` | Open Prisma Studio, a browser UI to view/edit rows |

Code imports the shared client from `src/db.js`:

```js
import { prisma } from '../db.js'
const accounts = await prisma.account.findMany()
```

Tables: `users`, `sessions`, `accounts` (each has a `userId` owner),
`categories` (shared), `transactions`. Money is whole **cents**
(`1250` = 12.50). Balances aren't stored; they're computed from
`openingBalance` + the account's transactions.

### Demo data (`prisma/seed.js`)

4 accounts (checking, savings, credit card, cash), 13 categories and about
4 months of transactions ending today: salary, rent, bills, subscriptions,
daily spending, and transfers (monthly savings, ATM withdrawals, credit card
payments). It uses a fixed random seed, so every run gives the same data.

## Tests

```bash
npm test             # run all tests once
npm run test:watch   # re-run on every save
```

[Vitest](https://vitest.dev) runs the files in `test/`, and
[Supertest](https://github.com/ladjs/supertest) sends real HTTP requests to
the Express app (no server needed – that's why `app.js` and `index.js` are
separate).

Tests use their **own database**: your database name + `_test`
(`bank` → `bank_test`), created and migrated automatically on the first run.
Every test starts from empty tables (`resetDb()`), and the setup refuses to
run against a database whose name doesn't end in `_test`.

On GitHub, `.github/workflows/server-tests.yml` runs the same tests on every
push that touches `server/` (with its own throwaway Postgres), so each commit
gets a ✓ or ✗.

`test/helpers.js` has `request` (logged in as a fresh test user after
`resetDb()`), `anonymous` (no cookie), `signUp(email)` for a second user,
`resetDb()`, and `createAccount()` /
`createCategory()` / `createTransaction()` to set up data quickly.

## Client


The client's Vite dev server forwards every `/api/*` request here, so the
React app just calls `fetch('/api/...')`.

## Layout

```
docker-compose.yml  local PostgreSQL container
.env.example        every env variable, with placeholder values
vitest.config.js    test settings (points tests at the _test database)
prisma.config.js    Prisma settings (loads .env, schema + migrations paths)
prisma/
  schema.prisma     the tables
  seed.js           demo data
  migrations/       SQL history, one folder per change
src/
  index.js        starts the server (reads PORT)
  db.js           the shared Prisma client
  app.js          builds the Express app: JSON parsing, routes, 404, errors
  routes/         one file per resource (health, accounts, …)
  schemas/        Zod schemas: what each endpoint accepts
  middleware/     validate() – checks requests against a schema
  services/       database logic shared by routes (e.g. the ledger query)
  lib/            HttpError, date helpers
test/
  globalSetup.js  migrates the test database before the run
  helpers.js      request, resetDb, createAccount/Category/Transaction
  *.test.js       one file per area (health, accounts, …)
```

## Login

Everything except `/api/health` and `/api/auth/*` needs a login.

- **Sign up / log in** with email + password. Passwords are hashed with
  Node's built-in `scrypt` (`src/lib/password.js`); only the hash is stored.
- A login creates a **session**: the browser gets a random token in the
  `bank_session` cookie (`httpOnly`, so page scripts can't read it; `Secure`
  in production), and the `sessions` table stores only its SHA-256 hash.
  Sessions last 30 days; logging out deletes it.
- `requireAuth` (`src/middleware/auth.js`) puts the user on `req.user`, and
  **every query is limited to that user's accounts**. Another user's
  account, transaction or transfer answers 404, as if it didn't exist.
- A failed login always says "Email or password is incorrect", so it doesn't
  reveal which emails have accounts.

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/auth/signup` | `{ email, password }` (8+ chars) | 201 `{ user }` + cookie (409 if the email is taken) |
| POST | `/api/auth/login` | `{ email, password }` | `{ user }` + cookie (401 if wrong) |
| POST | `/api/auth/logout` | | 204, cookie cleared |
| GET | `/api/auth/me` | | `{ user: { id, email } }` (401 if not logged in) |

## Endpoints

All money values are whole **cents**. Errors always look like
`{ "error": "message" }`; validation errors add `fields`:

```json
{ "error": "Validation failed", "fields": { "name": "Name is required" } }
```

| Method | Path | Body / query | Returns |
|--------|------|--------------|---------|
| GET | `/api/health` | | `{ status, db: 'ok' \| 'unreachable', time }` (503 if the database is down) |
| GET | `/api/accounts` | `?includeArchived=true` | Accounts with `balance` and `transactionCount` |
| GET | `/api/accounts/:id` | | One account (404 if missing) |
| POST | `/api/accounts` | `{ name, type?, openingBalance?, color? }` | 201 + the new account |
| PATCH | `/api/accounts/:id` | any of `{ name, type, openingBalance, color, archived }` | The updated account |
| GET | `/api/accounts/:id/transactions` | `?limit=50&cursor=…` + filters below | `{ items, nextCursor, totals }`, newest first, each with `runningBalance` (and `counterpartAccountId` for transfers) |
| POST | `/api/transactions` | `{ accountId, date, amount, description, categoryId?, note? }` | 201 + the transaction (409 if the account is archived) |
| PATCH | `/api/transactions/:id` | any of `{ date, amount, description, categoryId, note }` | The updated transaction (409 for a transfer side) |
| DELETE | `/api/transactions/:id` | | 204; deleting a transfer side deletes both sides |
| POST | `/api/transfers` | `{ fromAccountId, toAccountId, amount, date, description?, note? }` | 201 + the transfer |
| GET | `/api/transfers/:transferId` | | `{ transferId, fromAccountId, toAccountId, amount, date, description, note }` |
| PATCH | `/api/transfers/:transferId` | any of the create fields | The updated transfer (both rows) |
| DELETE | `/api/transfers/:transferId` | | 204, removes both rows |
| GET | `/api/summary` | `?month=YYYY-MM` (default: this month) | `{ month, income, spent, net, byCategory, trend }` |
| GET | `/api/categories` | | All categories (`{ id, name, kind: 'INCOME' \| 'EXPENSE', color }`), income first |

A transaction looks like `{ id, accountId, date: 'YYYY-MM-DD', amount, description,
note, transferId, category: { id, name, kind, color } | null }`.

**Transfers** are two transaction rows sharing a `transferId` (money out of
one account, into the other; `amount` in the transfer API is always
positive). They're created and edited inside a **database transaction**
(`prisma.$transaction`), so both rows are written together or not at all.
Edit them through `/api/transfers`; `PATCH /api/transactions/:id` refuses a
transfer side.

**Summary**: real income and spending only (transfers and archived accounts
are left out), as positive cents. `byCategory` = `[{ categoryId, name, color,
total, count }]` biggest first (`categoryId: null` = Uncategorized), from a
Prisma `groupBy`. `trend` = the last 6 months `[{ month, income, spent }]`,
from SQL `generate_series` so empty months show as 0.

**Pagination:** pass the `nextCursor` from one page as `cursor` to get the
next (older) page; `nextCursor: null` means you have everything.
**Filters** (all optional, combine freely): `q` (search description and note,
case-insensitive), `type` (`income`, `expense`, `transfer`), `categoryId`,
`from` / `to` (`YYYY-MM-DD`, inclusive). `totals` = `{ count, moneyIn, moneyOut }`
for everything that matches, not just the page. Filtering happens after the
running balance is computed, so each row still shows the real balance.
**Running balance** is computed in SQL with a window function
(`SUM(amount) OVER (ORDER BY date, id)`), see `src/services/transactions.js`.

`type` is `CHECKING`, `SAVINGS`, `CREDIT` or `CASH`. Accounts aren't
deleted; `PATCH { "archived": true }` hides them from the default list.

### Try it with curl

Log in first; `-c`/`-b` save and send the session cookie:

```bash
curl -c /tmp/bank.cookies -H 'Content-Type: application/json' \
  -d '{"email":"demo@bank.test","password":"demo1234"}' localhost:4000/api/auth/login
curl -b /tmp/bank.cookies localhost:4000/api/accounts
curl -b /tmp/bank.cookies -X POST localhost:4000/api/accounts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Travel fund","type":"SAVINGS","openingBalance":50000}'
```
