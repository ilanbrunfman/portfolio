/**
 * An error with an HTTP status. Throw it from any route:
 *   throw new HttpError(404, 'Account not found')
 * The error handler in app.js sends { error: message } with that status.
 *
 * `expose` marks the message as safe to show the client (unlike a random
 * crash, whose details stay in the server log).
 */
export class HttpError extends Error {
    constructor(status, message, extra = {}) {
        super(message)
        this.status = status
        this.expose = true
        Object.assign(this, extra) // e.g. { fields: { name: 'Required' } }
    }
}
