import express from 'express'
import cookieParser from 'cookie-parser'
import healthRouter from './shared/routes/health.js'
import { notFound, errorHandler } from './shared/middleware/errors.js'
import bank from './projects/bank/index.js'
import taim from './projects/taim/index.js'

// Builds the Express app. Kept separate from index.js (which starts it)
// so tests can import the app without opening a port.
//
// One app serves every project: shared/ holds what they all use,
// projects/<name>/ holds each project's own routes, services and schemas.
const app = express()

// In production the API sits behind the host's proxy (Render). Trust it, so
// Express sees the original HTTPS request (needed for Secure cookies).
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)

// Parse JSON request bodies into req.body, and cookies into req.cookies
app.use(express.json())
app.use(cookieParser())

// All routes live under /api; each project gets its own prefix
app.use('/api/health', healthRouter)
app.use('/api/bank', bank)
app.use('/api/taim', taim)

app.use(notFound)
app.use(errorHandler)

export default app
