import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import supertest from 'supertest'
import { requireStaff, allow } from '../../src/projects/taim/middleware/staff.js'
import { errorHandler } from '../../src/shared/middleware/errors.js'
import { RIGHTS, ROLES } from '../../src/projects/taim/roles.js'
import { resetTaim, prisma } from './helpers.js'

beforeEach(resetTaim)

// A tiny app with one route guarded like the real ones will be
// (requireStaff + allow). The real routes that use rights arrive with
// the menu, floor and kitchen steps; this proves the guard itself.
const guarded = express()
guarded.use(cookieParser())
guarded.get('/api/taim/edit-menu', requireStaff, allow('editMenu'), (req, res) => res.json({ ok: true, by: req.staff.name }))
guarded.use(errorHandler)
const request = supertest(guarded)

/** Send the request as the staff member with this role */
async function asRole(role) {
    const staff = await prisma.staff.findFirstOrThrow({ where: { role } })
    return request.get('/api/taim/edit-menu').set('Cookie', `taim_staff=${staff.id}`)
}

describe('allow(right)', () => {
    it('lets a role with the right through', async () => {
        const res = await asRole('CHEF')
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ ok: true, by: 'Avi' })
    })

    it('refuses a role without the right with 403', async () => {
        const res = await asRole('COOK')
        expect(res.status).toBe(403)
        expect(res.body.error).toBe("Your role can't do this")
    })

    it('answers 401 (not 403) when nobody was picked', async () => {
        await request.get('/api/taim/edit-menu').expect(401)
    })

    it('matches the rights grid for every role', async () => {
        for (const role of ROLES) {
            const res = await asRole(role)
            expect(res.status, role).toBe(RIGHTS.editMenu.includes(role) ? 200 : 403)
        }
    })

    it('fails right away for a right that does not exist (a typo in our code)', () => {
        expect(() => allow('editMenus')).toThrow('Unknown right "editMenus"')
    })
})

describe('the rights grid', () => {
    it('only uses real roles', () => {
        for (const [right, roles] of Object.entries(RIGHTS)) {
            for (const role of roles) expect(ROLES, right).toContain(role)
        }
    })

    it('gives the manager every right except the kitchen ones and publishing the menu (the Chef does)', () => {
        const notManager = ['advanceDish', 'fireHeld', 'publishMenu']
        expect(RIGHTS.publishMenu).toEqual(['CHEF'])
        for (const [right, roles] of Object.entries(RIGHTS)) {
            if (notManager.includes(right)) expect(roles).not.toContain('MANAGER')
            else expect(roles).toContain('MANAGER')
        }
    })
})
