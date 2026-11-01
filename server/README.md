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

**Ta'im** (`seeds/taim.js`): one staff member per role, each with a demo
PIN, phone, hourly rate and start date: Noa (Manager, 1111), Avi (Chef,
2222), Yossi (Cook, 3333), Dana (Host, 4444), Lior (Waiter, 5555), and
Tamar, a waiter who left; two weeks of clock-ins with breaks (a forgotten
clock-out, an entry Noa fixed, everyone on tonight); four menu
versions: the Spring menu (13 to 8 weeks ago), the Summer menu (8 to 3
weeks ago), the
Autumn menu in use now (4 categories, 13 dishes with prep times; Schnitzel
starts sold out) and a Winter draft by Avi (lentil soup, dearer mint tea); 8
tables (T1–T8). A busy evening right now: 4 tables dining and a take-out,
with kitchen tickets waiting, started, on hold, to go, a remake (a cold
shakshuka) and a fix (a kebab "medium, not rare"); T3 needs cleaning.
And 13 weeks of history: closed bills every day (more Thursday to
Saturday), some dishes coming back (remade or not), fixed, dropped or
redone, and each night closed as a business day through the app's own
close-the-day code (now and then automatically at 04:00). Fixed random
seed: the same data every run.

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
    lib/          HttpError, date helpers, password (and PIN) hashing
  projects/
    bank/         the bank tracker
      index.js    all bank routes as one router
      routes/     one file per resource (accounts, transactions, …)
      schemas/    Zod schemas: what each endpoint accepts
      services/   database logic shared by routes (e.g. the ledger query)
      middleware/ requireAuth
    taim/         Ta'im, the restaurant app
      index.js    all Ta'im routes as one router
      roles.js    who may do what: rights and screens per role
      routes/     staff, session, menu, menuVersions, floor (tables and orders), kitchen, …
      services/   order JSON and the bill total, business days, menu versions
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
    *.test.js     session, roles, menu, menuVersions, floor, kitchen, …
```

Each project lives in its own folder under `src/projects/` and only imports
from `shared/` and from itself, so projects never depend on each other.

## Bank tracker: login

Everything except `/api/health` and `/api/bank/auth/*` needs a login.

- **Sign up / log in** with email + password. Passwords are hashed with
  Node's built-in `scrypt` (`src/shared/lib/password.js`, shared with Ta'im's PINs); only the hash is stored.
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

On the "Who are you?" screen you tap your name and type your 4-digit PIN
(step 8.1). PINs are hashed with scrypt (like the bank's passwords) and
unique among the people working here; five wrong in a row lock that person
for a minute (counted in the database, so it holds across devices). The
right PIN starts a session: a random token in the `taim_session` cookie
(`httpOnly`, path `/api/taim`, 14 hours), and only its SHA-256 hash in
`staff_sessions`. The seed's people have demo PINs (1111 … 5555) that the
picker shows, so visitors can try every role; a PIN the Manager sets
replaces it. What that person may do depends on their **role**, and the
server checks it on every request:

- `requireStaff` (who are you?) loads the logged-in person onto
  `req.staff`, or answers **401** (no session, expired, or they left).
- `allow(right)` (may your role do this?) answers **403** if the role
  doesn't have that right.

The rights live in one place, `src/projects/taim/roles.js`:

| Right | Manager | Chef | Cook | Host | Waiter |
|---|:-:|:-:|:-:|:-:|:-:|
| `editMenu`: the draft menu (dishes, prices, categories); sold out on the menu in use | ✓ | ✓ | | | |
| `publishMenu`: publish the draft (now or on a date), or use an older menu again | ✓ | ✓ | | | |
| `setUpTables`: add, rename, seats | ✓ | | | | |
| `seatTable`: seat, start take-out, move or undo a seating | ✓ | | | ✓ | ✓ |
| `addDishes`: a table's dishes (add, send, move, remove) | ✓ | | | | ✓ |
| `takeoutOrders`: the same on a take-out | ✓ | | | ✓ | ✓ |
| `advanceDish`: preparing → sent out | ✓ | ✓ | ✓ | | |
| `markCameBack`: a dish came back | ✓ | ✓ | | | ✓ |
| `closeBill`: close the bill | ✓ | | | ✓ | ✓ |
| `seeLosses`: the losses summary | ✓ | ✓ | | | |
| `cleanTable`: mark a table clean | ✓ | | | ✓ | ✓ |
| `combineTables`: combine or split tables | ✓ | | | ✓ | |
| `manageStaff`: the roster (people, roles, rates, PINs) | ✓ | | | | |
| `manageTime`: who's on now, everyone's timesheets, fix anyone's entries | ✓ | | | ✓ | |

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/taim/staff` | | The people working here, Manager first: `[{ id, name, role, demoPin }]` |
| POST | `/api/taim/session` | `{ staffId, pin }` | `{ staff, rights, screens }` + session cookie. Wrong PIN 401 (tries left), 5 in a row 429 for a minute, left 403, no PIN yet 409, no such person 404 |
| GET | `/api/taim/session` | | The logged-in person: `{ staff, rights, screens }` (401 if nobody) |
| DELETE | `/api/taim/session` | | 204, this device's session ended (switch person) |
| GET | `/api/taim/roster` | | Everyone, working here first: role, phone, `hourlyRate` (cents), `startDate`, `active`, `hasPin`, `demoPin` (still in use), `lockedUntil` (`manageStaff`: Manager) |
| POST | `/api/taim/roster` | `{ name, role, phone?, hourlyRate?, startDate?, pin }` | 201 + the person (409 if someone working here has that PIN) |
| PATCH | `/api/taim/roster/:id` | any of those (not `pin`) + `active` | The person. `active: false` = they left: logged out everywhere. Not yourself; always one active Manager (409). Coming back clears the PIN |
| PUT | `/api/taim/roster/:id/pin` | `{ pin }` | 204; their other sessions end, the demo PIN is gone, a lock is lifted |
| GET | `/api/taim/clock` | | Your clock: the open entry (with breaks, worked minutes) and today's worked minutes; with `manageTime` also `onNow` (who's clocked in) |
| POST | `/api/taim/clock/in` · `/out` · `/break-start` · `/break-end` | | Your clock; 409 when it doesn't fit (already in, not in, already on a break…). Clocking out ends a break |
| GET | `/api/taim/timesheets` | `?from=&to=&staffId=` | Entries that started in the period, newest first, with worked and break minutes, totals and how many were forgotten. Your own, or anyone's with `manageTime` (403) |
| GET | `/api/taim/timesheets/team` | `?from=&to=` | Everyone's hours in the period (`manageTime`): one row per person (worked, breaks, entries, days, forgot, edited, on now) and the team totals |
| PATCH | `/api/taim/time-entries/:id` | `{ clockIn, clockOut, breaks, reason? }` | The fixed entry, marked edited and logged (who, before / after, why if given). Your own, or anyone's with `manageTime`. 400 for times out of order, in the future or breaks outside; 409 for an overlap |
| POST | `/api/taim/time-entries` | `{ staffId?, clockIn, clockOut, breaks, reason? }` | 201, an entry added by hand (forgot to clock in), logged |
| GET | `/api/taim/time-entries/:id/edits` | | Its edit log, newest first |
| GET | `/api/taim/menu` | | The menu in use: categories in menu order, each with its `items` in `position` order (hidden ones marked `hidden: true`) |
| POST | `/api/taim/categories` | `{ name }` | 201, added at the end of the draft's menu (409 if the name exists, or if there's no draft) |
| PATCH | `/api/taim/categories/:id` | `{ name }` | The renamed category (a draft category; 409 otherwise) |
| DELETE | `/api/taim/categories/:id` | | 204, a draft category with no dishes (409 otherwise) |
| POST | `/api/taim/menu-items` | `{ categoryId, name, price, description?, prepMinutes?, hidden? }` | 201 + the dish, at the top of its draft category (409 if the name exists, or the category isn't the draft's) |
| PATCH | `/api/taim/menu-items/:id` | any of those fields | The updated dish; `{ hidden: true }` = sold out; a new `categoryId` puts it at the top there. On the menu in use only `{ hidden }` (409 for anything else) |
| DELETE | `/api/taim/menu-items/:id` | | 204, takes a dish off the draft (409 for the menu in use or older ones: bills point at them) |
| PUT | `/api/taim/categories/:id/dish-order` | `{ dishIds }`, top first | The draft category's dishes in their new order (400 unless the list is exactly that category's dishes) |
| GET | `/api/taim/menu/versions` | | Every version, newest first: status, dates, who, `dishCount`, `changes` from the version it was based on, `stats` (income, perDay, bills, averageBill, dishesSold, topDishes, returnRate) for versions that were in use; `bestId` (most income per day), `lastId` (the one before the menu in use) |
| GET | `/api/taim/menu/versions/:id` | | One version with its categories and dishes |
| GET | `/api/taim/menu/versions/compare` | `?from=1&to=2` | `{ changes }`: dishes added, removed and changed (field by field) between any two versions |
| POST | `/api/taim/menu/versions` | `{ name, season?, note? }` | 201 + a new draft, a copy of the menu in use (409 if there's a draft or a scheduled menu already) |
| PATCH | `/api/taim/menu/versions/:id` | `{ name?, season?, note? }` | The version |
| DELETE | `/api/taim/menu/versions/:id` | | 204, discards the draft (or a scheduled one) with its dishes (409 for others) |
| POST | `/api/taim/menu/versions/:id/publish` | `{ startsAt? }` | The draft becomes the menu in use now (the old one is archived), or `SCHEDULED` from `startsAt` (`publishMenu`; 409 if it's not the draft or has no dishes) |
| POST | `/api/taim/menu/versions/:id/unschedule` | | 204, a scheduled menu goes back to being the draft (`publishMenu`) |
| POST | `/api/taim/menu/versions/:id/use` | | An older (archived) menu becomes the menu in use from now, as a new version ("Back from #2", same dishes and prices, sold out cleared); the one in use is archived; a draft stays (`publishMenu`; 409 unless archived) |
| GET | `/api/taim/tables` | | Tables in floor order; `order` = the open order's summary (`guests`, `openedAt`, `dishCount`, `notSent`, `cameBack`, `total`) or `null` when free; `needsCleaning` after guests leave |
| POST | `/api/taim/tables` | `{ label, seats }` | 201, added at the end of the floor (Manager; 409 if the label exists) |
| PATCH | `/api/taim/tables/:id` | `{ label?, seats? }` | The updated table (Manager) |
| POST | `/api/taim/tables/:id/clean` | | The table (or its whole group), ready again; a combined group splits up (409 while it still has guests) |
| POST | `/api/taim/tables/combine` | `{ tableIds }` (2 or more) | 201 + the main table with `groupLabel` ("T1 + T4 + T7") and `groupSeats`; only free, clean, single tables (409 otherwise) |
| POST | `/api/taim/tables/:id/split` | | The main table back on its own; only while nobody is seated (409) |
| POST | `/api/taim/tables/:id/needs-cleaning` | | The table, back to needing cleaning ("not clean enough"; 409 while it has guests) |
| GET | `/api/taim/orders` | `?status=OPEN` (default) or `CLOSED` | Orders with their dishes and `total`; open ones oldest first |
| GET | `/api/taim/orders/:id` | | One order: `table` or `customerName` + `customerPhone`, `guests`, `openedBy`, `items` (name, price, status), `total` |
| POST | `/api/taim/orders` | `{ type: 'TABLE', tableId, guests }` or `{ type: 'TAKEOUT', customerName, customerPhone? }` | 201 + the order (409 if the table is already seated or needs cleaning) |
| PATCH | `/api/taim/orders/:id` | `{ tableId?, guests? }` | Fix a seating: move to another ready table and/or change guests (409 if fewer guests than a seat with dishes) |
| DELETE | `/api/taim/orders/:id` | | 204, undo a seating or take-out; only while it has no dishes (409 otherwise) |
| POST | `/api/taim/orders/:id/items` | `{ items: [{ menuItemId, quantity?, seat? }] }` | 201 + the order; one row per dish (`NEW`, not sent yet), price copied from the menu (409 if a dish is sold out, from another menu version, or the bill is closed) |
| POST | `/api/taim/orders/:id/send` | | Send every dish not sent yet to the kitchen as the order's next `round` (`NEW` → `PREPARING`, `firedAt` set); 409 if there's nothing new |
| PATCH | `/api/taim/orders/:id/items/:itemId` | `{ seat }` (a number, or `null` = shared) | The order with the dish moved to that seat; any time while the bill is open |
| DELETE | `/api/taim/orders/:id/items/:itemId` | | The order without that dish; while it's `NEW` or `PREPARING` (409 once sent out) |
| POST | `/api/taim/orders/:id/close` | | The closed order; the table now needs cleaning (409 if already closed, or while dishes are not sent or still in the kitchen) |
| GET | `/api/taim/kitchen` | | `tickets`: one per send (table round or take-out), oldest first, with the dishes still cooking (`name`, `seat`, `prepMinutes`); `recentlyServed`: dishes served in the last 10 minutes |
| POST | `/api/taim/order-items/:id/serve` | | 204, the dish is out of the kitchen (`advanceDish`; 409 unless it's being prepared) |
| POST | `/api/taim/order-items/:id/unserve` | | 204, served by mistake: back to the kitchen (409 unless it was served) |
| PUT | `/api/taim/orders/:id/allergies` | `{ seat, allergens, note }` | The order; a guest's allergy on the bill: a seat, or `seat: null` = the whole table / take-out (one row each); no allergens and no note removes it. Dishes still cooking need Seen again. Same right as adding dishes |
| POST | `/api/taim/orders/:id/rounds/:round/allergy-seen` | | 204, the kitchen saw the ticket's allergies (`advanceDish`); Start and Served refuse (409) until then |

`rights` and `screens` are the role's entries from `roles.js`, so the
client can show only the screens that person may use.

Everything except `/staff` and `/session` needs a picked person (401).
Changing the menu needs `editMenu` (403 for Cook, Host, Waiter). Dishes of
a menu that was used are never deleted, only hidden, because orders point
to them; each dish can have a `prepMinutes` (how long the kitchen should take, 1–180,
set by the Chef; the Kitchen screen shows dishes against it); a price
must be above 0, which the database itself also enforces (a `CHECK` rule
added by hand to the migration).

Each dish has a `position` in its category (1 = top). Adding a dish shifts
the others down one and takes position 1, in one transaction; saving a new
order after a drag rewrites every position of that category in one
transaction, so a half-saved order can't happen.

**Time clock (step 8.2).** An entry runs from clock-in to clock-out with
its breaks (unpaid: worked = clocked − breaks). The database keeps it
honest: one open entry per person and one open break per entry (partial
unique indexes), no two entries of the same person overlapping and no
overlapping breaks (exclusion constraints on a `tsrange`, with the
`btree_gist` extension), times in order and a reason that, when given, isn't
empty (`CHECK`s). The timer that closes the day also closes entries nobody
clocked out of by the end of the day (04:00), flagged `forgot`. Every fix
by hand is logged in `time_edits` with who, its before and after, and the
reason if one was picked.

**Allergies (step 5.4).** Each dish lists its allergens (gluten, dairy,
egg, peanuts, tree nuts, sesame, fish, shellfish, soy), set by the Chef;
unlike prices they can be fixed on the menu in use. A guest's allergy is
noted on the bill (`seat_allergies`: a seat, or the whole table /
take-out; kept with that bill only, never linked to a person). Adding or
moving a dish that clashes (its allergens ∩ its seat's and the whole
table's allergies; a shared dish counts everyone's) answers 409 unless the
waiter sends `allergyConfirmed` ("the kitchen will adapt it"). A kitchen
ticket shows the allergies of its seats, and Start / Served refuse until a
cook taps Seen; changing the allergies while it cooks asks again. A dish
that came back for an allergy needs a note. The database keeps one row per
seat per bill (a unique index with `NULLS NOT DISTINCT`, so there is one
whole-table row too) and refuses an empty allergy (a `CHECK`).

**Menu versions.** The menu guests order from is one `ACTIVE` version.
Changes go into a `DRAFT`: a copy of it (`POST /menu/versions`), where
dishes, prices and categories change freely while guests keep ordering
from the menu in use. The Manager or the Chef publishes the draft now, or from a date
(`SCHEDULED`: the timer that closes days switches it at that time, and
any read of the menu does too); the version it replaces becomes
`ARCHIVED` with the dates it ran. An older menu can be picked again: it
comes back as a new version, so each version keeps one period and its
income stays right. Sold out is the one change made on the
menu in use: that's day to day, not a new version. Each version has its
own rows of dishes, so an order line keeps pointing at the dish (and
version) it was ordered from; a `dishKey` follows the same dish across
versions, so the Versions tab can say what changed (added, removed,
price 13 → 14). The database keeps it straight: one `ACTIVE`, one `DRAFT`
and one `SCHEDULED` at most (partial unique indexes), dates that fit the
status (a `CHECK`), and a dish's category must be of the same version (a
foreign key on both columns). Income per version is what closed bills
paid for its dishes; per day makes menus that ran for different lengths
comparable.

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

A dish's life: `NEW` (on the bill; the waiter can still change or remove
it) → **Send to kitchen** → `PREPARING` → the kitchen sends it out →
`SENT_OUT` → maybe `CAME_BACK` (step 6). A bill can't be closed while any
dish is still `NEW` or in the kitchen (`PREPARING`).

**Combined tables:** `POST /tables/combine` points the other tables of a
group at its main table (the first on the floor, `joinedToId`). The main
table takes the group's order, so the one-open-order rule still holds; a
joined table can't be seated on its own. Guests can't outnumber the seats:
a single table's own, or a group's total (T1 + T4 + T7 = 10), when seating,
changing the guest count or moving. Closing the bill makes the whole
group need cleaning, and cleaning it splits it back into single tables.

Each send is a numbered **round** (1 = e.g. starters,
2 = the mains added later…), stored on the dish, so the bill and the kitchen
see what was ordered when; the database requires a round exactly on sent
dishes.

```bash
curl localhost:4000/api/taim/staff
curl -c /tmp/taim.cookies -H 'Content-Type: application/json' \
  -d '{"staffId":3,"pin":"3333"}' localhost:4000/api/taim/session
curl -b /tmp/taim.cookies localhost:4000/api/taim/session
```
