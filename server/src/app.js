import express from 'express'
import healthRouter from './routes/health.js'

// Builds the Express app. Kept separate from index.js (which starts it)
// so tests can import the app without opening a port.
const app = express()

// Parse JSON request bodies into req.body
app.use(express.json())

// All routes live under /api
app.use('/api/health', healthRouter)

// Unknown /api route → 404 in JSON (not Express's default HTML page)
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' })
})

// Anything thrown in a route ends up here. Express 5 also catches
// errors from async routes, so no try/catch is needed in each one.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err)
    res.status(err.status ?? 500).json({ error: err.expose ? err.message : 'Something went wrong' })
})

export default app
