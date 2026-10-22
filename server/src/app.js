import express from 'express'
import healthRouter from './routes/health.js'
import accountsRouter from './routes/accounts.js'
import categoriesRouter from './routes/categories.js'
import transactionsRouter from './routes/transactions.js'
import transfersRouter from './routes/transfers.js'
import summaryRouter from './routes/summary.js'

// Builds the Express app. Kept separate from index.js (which starts it)
// so tests can import the app without opening a port.
const app = express()

// Parse JSON request bodies into req.body
app.use(express.json())

// All routes live under /api
app.use('/api/health', healthRouter)
app.use('/api/accounts', accountsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/transfers', transfersRouter)
app.use('/api/summary', summaryRouter)

// Unknown /api route → 404 in JSON (not Express's default HTML page)
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' })
})

// Anything thrown in a route ends up here. Express 5 also catches
// errors from async routes, so no try/catch is needed in each one.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // Prisma: update/delete of a row that doesn't exist
    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Not found' })
    }
    // Prisma: a foreign key points to a row that doesn't exist
    if (err.code === 'P2003') {
        return res.status(400).json({ error: 'Related record not found' })
    }
    // Bad JSON in the request body (from express.json())
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON' })
    }
    // Our own HttpErrors (and validation errors) are safe to show
    if (err.expose) {
        return res.status(err.status).json({ error: err.message, ...(err.fields && { fields: err.fields }) })
    }
    // Anything else is a bug: log it, but don't leak details to the client
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
})

export default app
