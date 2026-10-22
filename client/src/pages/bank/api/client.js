/**
 * Tiny fetch wrapper for the bank API (server/).
 * In dev, Vite proxies /api to the Express server.
 *
 * - Sends/receives JSON
 * - Throws an Error with the server's `error` message on non-2xx responses
 *   ('API not reachable' when the server isn't running)
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
        // 502/504 with no JSON = the Vite proxy couldn't reach the Express server
        const fallback = [502, 504].includes(res.status) ? 'API not reachable' : `Request failed (${res.status})`
        throw new Error(data?.error ?? fallback)
    }
    return data
}
