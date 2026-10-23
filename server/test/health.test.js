import { describe, it, expect } from 'vitest'
import { request } from './helpers.js'

describe('GET /api/health', () => {
    it('reports the server and database as ok', async () => {
        const res = await request.get('/api/health').expect(200)
        expect(res.body).toMatchObject({ status: 'ok', db: 'ok' })
    })

    it('answers unknown routes with a JSON 404', async () => {
        const res = await request.get('/api/nope').expect(404)
        expect(res.body).toEqual({ error: 'Not found' })
    })

    it('rejects broken JSON with a 400', async () => {
        const res = await request.post('/api/accounts').set('Content-Type', 'application/json').send('{bad').expect(400)
        expect(res.body).toEqual({ error: 'Invalid JSON' })
    })
})
