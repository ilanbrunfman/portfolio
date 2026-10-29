/** Fired on window when the API says nobody is picked (e.g. the cookie is gone) */
export const UNAUTHORIZED_EVENT = 'taim:unauthorized'

/**
 * Tiny fetch wrapper for the Ta'im API (server/src/projects/taim).
 * In dev, Vite proxies /api to the Express server.
 *
 * - Sends/receives JSON
 * - Throws an Error with the server's `error` message on non-2xx responses
 *   ('API not reachable' when the server isn't running). The error also has
 *   `status`, and `fields` for validation errors.
 *
 * @param {string} path               e.g. '/staff' → GET /api/taim/staff
 * @param {RequestInit & {body?: any}} [options]  `body` may be a plain object.
 */
export async function api(path, { body, headers, ...options } = {}) {
    const res = await fetch(`/api/taim${path}`, {
        ...options,
        headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const data = res.status === 204 ? null : await res.json().catch(() => null)

    // Nobody picked any more (but not the "who's picked?" check itself):
    // tell the app so it shows "Who are you?" again
    if (res.status === 401 && path !== '/session') {
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }

    if (!res.ok) {
        // 502/504 with no JSON = the Vite proxy couldn't reach the Express server
        const fallback = [502, 504].includes(res.status) ? 'API not reachable' : `Request failed (${res.status})`
        const error = new Error(data?.error ?? fallback)
        error.status = res.status
        error.fields = data?.fields ?? {}
        throw error
    }
    return data
}
