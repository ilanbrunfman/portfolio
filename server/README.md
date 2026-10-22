# Server

Express API for the bank tracker (`/bank` in the client).

## Run it

```bash
cp .env.example .env   # first time only
npm install
npm run dev            # http://localhost:4000, restarts on file changes
```

The client's Vite dev server forwards every `/api/*` request here, so the
React app just calls `fetch('/api/...')`.

## Layout

```
src/
  index.js        starts the server (reads PORT)
  app.js          builds the Express app: JSON parsing, routes, 404, errors
  routes/         one file per resource (health, accounts, transactions, …)
```

## Endpoints

| Method | Path          | Returns |
|--------|---------------|---------|
| GET    | `/api/health` | `{ status: 'ok', time }` |
