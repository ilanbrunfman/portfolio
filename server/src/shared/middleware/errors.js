// The last two middlewares of the app, shared by every project.

// Unknown /api route → 404 in JSON (not Express's default HTML page)
export function notFound(req, res) {
    res.status(404).json({ error: 'Not found' })
}

// Anything thrown in a route ends up here. Express 5 also catches
// errors from async routes, so no try/catch is needed in each one.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
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
}
