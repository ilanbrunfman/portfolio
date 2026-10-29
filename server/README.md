# Server

One Express API for the portfolio's full-stack projects:

- **Bank tracker** (`/bank` in the client): routes under `/api/bank`
- **Ta'im**, a restaurant app (`/taim` in the client): routes under `/api/taim`

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

The tables are described in `prisma/schema/`: `schema.prisma` holds the
shared settings, and each project has its own file (`bank.prisma`, `taim.prisma`).
Each project's tables also live in their own **Postgres schema**, a named
folder of tables inside the one database: the bank's are `bank.accounts`,
`bank.transactions`, and so on. Raw SQL names them that way too.

Prisma turns changes into
SQL migration files (`prisma/migrations/`, committed) and generates a typed
client in `src/generated/prisma/` (not committed, rebuilt on `npm install`).

| Command | What it does |
|---------|--------------|
| `npm run db:migrate` | After editing the schema: write a migration, apply it, regenerate the client |
| `npm run db:generate` | Regenerate the client only |
| `npm run db:seed` | Replace all rows with demo data, every project (**deletes existing rows**) |
| `npm run db:seed:bank` / `db:seed:taim` | The same, for one project only (the other keeps its rows) |
| `npm run db:reset` | Drop everything, re-run all migrations, then seed (**deletes data**) |
| `npm run db:studio` | Open Prisma Studio, a browser UI to view/edit rows |

Code imports the shared client from `src/shared/db.js`:

```js
import { prisma } from '../../../shared/db.js'
const accounts = await prisma.account.findMany()
```

Tables: `users`, `sessions`, `accounts` (each has a `userId` owner),
`categories` (shared), `transactions`. Money is whole **cents**
(`1250` = 12.50). Balances aren't stored; they're computed from
`openingBalance` + the account's transactions.

### Demo data (`prisma/seeds/`)

`prisma/seed.js` runs one seed per project from `prisma/seeds/`; each
empties only its own tables first.

**Bank** (`seeds/bank.js`): 4 accounts (checking, savings, credit card, cash), 13 categories and about
4 months of transactions ending today: salary, rent, bills, subscriptions,
daily spending, and transfers (monthly savings, ATM withdrawals, credit card
payments). It uses a fixed random seed, so every run gives the same data.

**Ta'im** (`seeds/taim.js`): one staff member per role: Noa (Manager),
Avi (Chef), Yossi (Cook), Dana (Host), Lior (Waiter); and a menu of 4
categories and 13 dishes (Schnitzel starts sold out); 8 tables (T1–T8) and 3 open orders (T2, T5
and a take-out for Maya) so the floor isn't empty.

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

`test/bank/helpers.js` has `request` (logged in as a fresh test user after
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
  schema/
    schema.prisma   shared settings (generator, database, list of schemas)
    bank.prisma     the bank tables (Postgres schema "bank")
    taim.prisma     the Ta'im tables (Postgres schema "taim")
  seed.js           runs the demo data seeds
  seeds/            one seed per project (bank.js, taim.js)
  migrations/       SQL history, one folder per change
src/
  index.js        starts the server (reads PORT)
  app.js          builds the Express app: JSON parsing, mounts each project, 404, errors
  shared/         used by every project
    db.js         the shared Prisma client
    routes/       health
    middleware/   validate() (checks requests against a schema), 404 + error handler
    schemas/      Zod pieces used everywhere (ids, cents)
    lib/          HttpError, date helpers
  projects/
    bank/         the bank tracker
      index.js    all bank routes as one router
      routes/     one file per resource (accounts, transactions, …)
      schemas/    Zod schemas: what each endpoint accepts
      services/   database logic shared by routes (e.g. the ledger query)
      middleware/ requireAuth
      lib/        password hashing
    taim/         Ta'im, the restaurant app
      index.js    all Ta'im routes as one router
      roles.js    who may do what: rights and screens per role
      routes/     staff, session, menu, floor (tables and orders)
      services/   order JSON and the bill total
      schemas/    Zod schemas
      middleware/ requireStaff + allow(right)
test/
  globalSetup.js  migrates the test database before the run
  health.test.js  shared routes
  bank/
    helpers.js    request, resetDb, createAccount/Category/Transaction
    *.test.js     one file per area (accounts, transactions, …)
  taim/
    helpers.js    resetTaim, as(role)
    *.test.js     session, roles, menu, floor
```

Each project lives in its own folder under `src/projects/` and only imports
from `shared/` and from itself, so projects never depend on each other.

## Bank tracker: login

Everything except `/api/health` and `/api/bank/auth/*` needs a login.

- **Sign up / log in** with email + password. Passwords are hashed with
  Node's built-in `scrypt` (`src/projects/bank/lib/password.js`); only the hash is stored.
- A login creates a **session**: the browser gets a random token in the
  `bank_session` cookie (`httpOnly`, so page scripts can't read it; `Secure`
  in production), and the `sessions` table stores only its SHA-256 hash.
  Sessions last 30 days; logging out deletes it.
- `requireAuth` (`src/projects/bank/middleware/auth.js`) puts the user on `req.user`, and
  **every query is limited to that user's accounts**. Another user's
  account, transaction or transfer answers 404, as if it didn't exist.
- A failed login always says "Email or password is incorrect", so it doesn't
  reveal which emails have accounts.

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/bank/auth/signup` | `{ email, password }` (8+ chars) | 201 `{ user }` + cookie (409 if the email is taken) |
| POST | `/api/bank/auth/login` | `{ email, password }` | `{ user }` + cookie (401 if wrong) |
| POST | `/api/bank/auth/logout` | | 204, cookie cleared |
| GET | `/api/bank/auth/me` | | `{ user: { id, email } }` (401 if not logged in) |

## Bank tracker: endpoints

All money values are whole **cents**. Errors always look like
`{ "error": "message" }`; validation errors add `fields`:

```json
{ "error": "Validation failed", "fields": { "name": "Name is required" } }
```

| Method | Path | Body / query | Returns |
|--------|------|--------------|---------|
| GET | `/api/health` | | `{ status, db: 'ok' \| 'unreachable', time }` (503 if the database is down) |
| GET | `/api/bank/accounts` | `?includeArchived=true` | Accounts with `balance` and `transactionCount` |
| GET | `/api/bank/accounts/:id` | | One account (404 if missing) |
| POST | `/api/bank/accounts` | `{ name, type?, openingBalance?, color? }` | 201 + the new account |
| PATCH | `/api/bank/accounts/:id` | any of `{ name, type, openingBalance, color, archived }` | The updated account |
| GET | `/api/bank/accounts/:id/transactions` | `?limit=50&cursor=…` + filters below | `{ items, nextCursor, totals }`, newest first, each with `runningBalance` (and `counterpartAccountId` for transfers) |
| POST | `/api/bank/transactions` | `{ accountId, date, amount, description, categoryId?, note? }` | 201 + the transaction (409 if the account is archived) |
| PATCH | `/api/bank/transactions/:id` | any of `{ date, amount, description, categoryId, note }` | The updated transaction (409 for a transfer side) |
| DELETE | `/api/bank/transactions/:id` | | 204; deleting a transfer side deletes both sides |
| POST | `/api/bank/transfers` | `{ fromAccountId, toAccountId, amount, date, description?, note? }` | 201 + the transfer |
| GET | `/api/bank/transfers/:transferId` | | `{ transferId, fromAccountId, toAccountId, amount, date, description, note }` |
| PATCH | `/api/bank/transfers/:transferId` | any of the create fields | The updated transfer (both rows) |
| DELETE | `/api/bank/transfers/:transferId` | | 204, removes both rows |
| GET | `/api/bank/summary` | `?month=YYYY-MM` (default: this month) | `{ month, income, spent, net, byCategory, trend }` |
| GET | `/api/bank/categories` | | All categories (`{ id, name, kind: 'INCOME' \| 'EXPENSE', color }`), income first |

A transaction looks like `{ id, accountId, date: 'YYYY-MM-DD', amount, description,
note, transferId, category: { id, name, kind, color } | null }`.

**Transfers** are two transaction rows sharing a `transferId` (money out of
one account, into the other; `amount` in the transfer API is always
positive). They're created and edited inside a **database transaction**
(`prisma.$transaction`), so both rows are written together or not at all.
Edit them through `/api/bank/transfers`; `PATCH /api/bank/transactions/:id` refuses a
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
(`SUM(amount) OVER (ORDER BY date, id)`), see `src/projects/bank/services/transactions.js`.

`type` is `CHECKING`, `SAVINGS`, `CREDIT` or `CASH`. Accounts aren't
deleted; `PATCH { "archived": true }` hides them from the default list.

### Try it with curl

Log in first; `-c`/`-b` save and send the session cookie:

```bash
curl -c /tmp/bank.cookies -H 'Content-Type: application/json' \
  -d '{"email":"demo@bank.test","password":"demo1234"}' localhost:4000/api/bank/auth/login
curl -b /tmp/bank.cookies localhost:4000/api/bank/accounts
curl -b /tmp/bank.cookies -X POST localhost:4000/api/bank/accounts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Travel fund","type":"SAVINGS","openingBalance":50000}'
```

## Ta'im: staff and roles

Ta'im has no passwords: on the "Who are you?" screen you pick a staff
member, and the `taim_staff` cookie (`httpOnly`, path `/api/taim`)
remembers who. What that person may do depends on their **role**, and the
server checks it on every request:

- `requireStaff` (who are you?) loads the picked person onto `req.staff`,
  or answers **401** if nobody was picked.
- `allow(right)` (may your role do this?) answers **403** if the role
  doesn't have that right.

The rights live in one place, `src/projects/taim/roles.js`:

| Right | Manager | Chef | Cook | Host | Waiter |
|---|:-:|:-:|:-:|:-:|:-:|
| `editMenu`: dishes and prices | ✓ | ✓ | | | |
| `setUpTables`: add, rename, seats | ✓ | | | | |
| `seatTable`: seat, start take-out, move or undo a seating | ✓ | | | ✓ | ✓ |
| `addDishes`: add dishes to an order | ✓ | | | | ✓ |
| `advanceDish`: preparing → sent out | ✓ | ✓ | ✓ | | |
| `markCameBack`: a dish came back | ✓ | ✓ | | | ✓ |
| `closeBill`: close the bill | ✓ | | | ✓ | ✓ |
| `seeLosses`: the losses summary | ✓ | ✓ | | | |
| `cleanTable`: mark a table clean | ✓ | | | ✓ | ✓ |

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/taim/staff` | | Everyone to pick from, Manager first: `[{ id, name, role }]` |
| POST | `/api/taim/session` | `{ staffId }` | `{ staff, rights, screens }` + cookie (404 if no such person) |
| GET | `/api/taim/session` | | The picked person: `{ staff, rights, screens }` (401 if nobody) |
| DELETE | `/api/taim/session` | | 204, cookie cleared (switch person) |
| GET | `/api/taim/menu` | | Categories in menu order, each with its `items` in `position` order (hidden ones marked `hidden: true`) |
| POST | `/api/taim/categories` | `{ name }` | 201, added at the end of the menu (409 if the name exists) |
| PATCH | `/api/taim/categories/:id` | `{ name }` | The renamed category |
| DELETE | `/api/taim/categories/:id` | | 204, only when it has no dishes (409 otherwise) |
| POST | `/api/taim/menu-items` | `{ categoryId, name, price, description?, hidden? }` | 201 + the dish, at the top of its category (409 if the name exists) |
| PATCH | `/api/taim/menu-items/:id` | any of those fields | The updated dish; `{ hidden: true }` = sold out; a new `categoryId` puts it at the top there |
| PUT | `/api/taim/categories/:id/dish-order` | `{ dishIds }`, top first | The category's dishes in their new order (400 unless the list is exactly that category's dishes) |
| GET | `/api/taim/tables` | | Tables in floor order; `order` = the open order's summary (`guests`, `openedAt`, `dishCount`, `cameBack`, `total`) or `null` when free; `needsCleaning` after guests leave |
| POST | `/api/taim/tables` | `{ label, seats }` | 201, added at the end of the floor (Manager; 409 if the label exists) |
| PATCH | `/api/taim/tables/:id` | `{ label?, seats? }` | The updated table (Manager) |
| POST | `/api/taim/tables/:id/clean` | | The table, ready again (409 while it still has guests) |
| GET | `/api/taim/orders` | `?status=OPEN` (default) or `CLOSED` | Orders with their dishes and `total`; open ones oldest first |
| GET | `/api/taim/orders/:id` | | One order: `table` or `customerName`, `guests`, `openedBy`, `items` (name, price, status), `total` |
| POST | `/api/taim/orders` | `{ type: 'TABLE', tableId, guests }` or `{ type: 'TAKEOUT', customerName }` | 201 + the order (409 if the table is already seated or needs cleaning) |
| PATCH | `/api/taim/orders/:id` | `{ tableId?, guests? }` | Fix a seating: move to another ready table and/or change guests (409 if fewer guests than a seat with dishes) |
| DELETE | `/api/taim/orders/:id` | | 204, undo a seating or take-out; only while it has no dishes (409 otherwise) |
| POST | `/api/taim/orders/:id/items` | `{ items: [{ menuItemId, quantity?, seat? }] }` | 201 + the order; one row per dish, price copied from the menu (409 if a dish is sold out or the bill is closed) |
| PATCH | `/api/taim/orders/:id/items/:itemId` | `{ seat }` (a number, or `null` = shared) | The order with the dish moved to that seat; any time while the bill is open |
| DELETE | `/api/taim/orders/:id/items/:itemId` | | The order without that dish; only while it's still `PREPARING` (409 otherwise) |
| POST | `/api/taim/orders/:id/close` | | The closed order; the table now needs cleaning (409 if already closed) |

`rights` and `screens` are the role's entries from `roles.js`, so the
client can show only the screens that person may use.

Everything except `/staff` and `/session` needs a picked person (401).
Changing the menu needs `editMenu` (403 for Cook, Host, Waiter). Dishes are
never deleted, only hidden, because orders will point to them; a price
must be above 0, which the database itself also enforces (a `CHECK` rule
added by hand to the migration).

Each dish has a `position` in its category (1 = top). Adding a dish shifts
the others down one and takes position 1, in one transaction; saving a new
order after a drag rewrites every position of that category in one
transaction, so a half-saved order can't happen.

**Floor and orders.** A table is "taken" while it has an `OPEN` order; it
isn't stored anywhere else. The database allows at most one open order per
table (a partial unique index, `WHERE status = 'OPEN'`), so seating a taken
table answers 409 even when two hosts tap at the same moment: there is no
"is it free?" check in code that two requests could both pass. A `CHECK`
rule makes table orders have a table and guests, and take-outs a name and no
table. Each dish on an order is its own row with the price copied in when it
was added, so changing a menu price never rewrites an old bill. The bill
total is calculated from the rows, leaving out dishes that came back.

A table's colour on the floor: **green** ready, **grey** dining (an open
order), **yellow** needs cleaning (`needsCleaning`, set in the same
transaction that closes the bill, cleared by `POST /tables/:id/clean`). A
table that needs cleaning can't be seated. Each dish can carry a `seat`
(1…guests, or `null` = shared) so the runner knows who gets what;
take-outs have no seats.

```bash
curl localhost:4000/api/taim/staff
curl -c /tmp/taim.cookies -H 'Content-Type: application/json' \
  -d '{"staffId":3}' localhost:4000/api/taim/session
curl -b /tmp/taim.cookies localhost:4000/api/taim/session
```
