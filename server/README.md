# Server

Express API for the bank tracker (`/bank` in the client).

## Run it

Needs Docker Desktop running (for the database).

```bash
cp .env.example .env   # first time only – then set a real POSTGRES_PASSWORD
                       # (and the same password inside DATABASE_URL)
docker compose up -d   # start PostgreSQL on localhost:5433
npm install
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

The client's Vite dev server forwards every `/api/*` request here, so the
React app just calls `fetch('/api/...')`.

## Layout

```
docker-compose.yml  local PostgreSQL container
.env.example        every env variable, with placeholder values
src/
  index.js        starts the server (reads PORT)
  app.js          builds the Express app: JSON parsing, routes, 404, errors
  routes/         one file per resource (health, accounts, transactions, …)
```

## Endpoints

| Method | Path          | Returns |
|--------|---------------|---------|
| GET    | `/api/health` | `{ status: 'ok', time }` |
