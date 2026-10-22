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
npm run db:seed        # optional: fill in demo data
npm run dev            # http://localhost:4000, restarts on file changes
```

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

Tables: `accounts`, `categories`, `transactions`. Money is whole **cents**
(`1250` = 12.50). Balances aren't stored; they're computed from
`openingBalance` + the account's transactions.

### Demo data (`prisma/seed.js`)

4 accounts (checking, savings, credit card, cash), 13 categories and about
4 months of transactions ending today: salary, rent, bills, subscriptions,
daily spending, and transfers (monthly savings, ATM withdrawals, credit card
payments). It uses a fixed random seed, so every run gives the same data.

## Client


The client's Vite dev server forwards every `/api/*` request here, so the
React app just calls `fetch('/api/...')`.

## Layout

```
docker-compose.yml  local PostgreSQL container
.env.example        every env variable, with placeholder values
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
  lib/            HttpError
```

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
| GET | `/api/categories` | | All categories (`{ id, name, kind: 'INCOME' \| 'EXPENSE', color }`), income first |

`type` is `CHECKING`, `SAVINGS`, `CREDIT` or `CASH`. Accounts aren't
deleted; `PATCH { "archived": true }` hides them from the default list.

### Try it with curl

```bash
curl localhost:4000/api/accounts
curl -X POST localhost:4000/api/accounts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Travel fund","type":"SAVINGS","openingBalance":50000}'
```
