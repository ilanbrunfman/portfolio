/**
 * Tiny fetch wrapper for the bank API (server/).
 * In dev, Vite proxies /api to the Express server.
 *
 * - Sends/receives JSON
 * - Throws an Error with the server's `error` message on non-2xx responses
 *
 * @param {string} path               e.g. '/health' → GET /api/health
 * @param {RequestInit & {body?: any}} [options]  `body` may be a plain object.
 */
export async function api(path, { body, headers, ...options } = {}) {
    const res = await fetch(`/api${path}`, {
        ...options,
        headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const data = res.status === 204 ? null : await res.json().catch(() => null)

    if (!res.ok) {
        throw new Error(data?.error ?? `Request failed (${res.status})`)
    }
    return data
}
