import { HttpError } from '../lib/httpError.js'

/**
 * Validates parts of the request with Zod schemas before the route runs.
 *
 *   router.post('/', validate({ body: accountCreate }), handler)
 *
 * On success the parsed (cleaned, defaulted) values are on `req.valid`:
 *   req.valid.body, req.valid.params, req.valid.query
 * On failure it responds 400:
 *   { error: 'Validation failed', fields: { name: 'Name is required' } }
 *
 * @param {{ body?: import('zod').ZodType, params?: import('zod').ZodType, query?: import('zod').ZodType }} schemas
 */
export const validate = (schemas) => (req, res, next) => {
    req.valid = {}
    const fields = {}

    for (const [part, schema] of Object.entries(schemas)) {
        const result = schema.safeParse(req[part] ?? {})
        if (result.success) {
            req.valid[part] = result.data
            continue
        }
        for (const issue of result.error.issues) {
            // first message per field wins; '_' = about the whole object
            const key = issue.path.join('.') || '_'
            fields[key] ??= issue.message
        }
    }

    if (Object.keys(fields).length > 0) {
        throw new HttpError(400, 'Validation failed', { fields })
    }
    next()
}
