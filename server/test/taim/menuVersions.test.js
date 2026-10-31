import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'
import { applyDueVersion } from '../../src/projects/taim/services/menuVersions.js'

// Step 3.1: menu versions. Version 1 (from resetTaim) is the menu in use;
// here it gets Mains with Shakshuka and Schnitzel (sold out).
let chef
let manager
let shakshuka

beforeEach(async () => {
    await resetTaim()
    chef = await as('CHEF')
    manager = await as('MANAGER')
    const mains = await prisma.menuCategory.create({
        data: {
            versionId: 1,
            name: 'Mains',
            position: 1,
            items: { create: [{ name: 'Shakshuka', price: 1400, prepMinutes: 10, position: 1 }, { name: 'Schnitzel', price: 1800, hidden: true, position: 2 }] },
        },
        include: { items: true },
    })
    shakshuka = mains.items.find((dish) => dish.name === 'Shakshuka')
})

const startDraft = (body = { name: 'Autumn menu' }, agent = chef) => agent.post('/api/taim/menu/versions').send(body)
const publish = (id, body = {}, agent = chef) => agent.post(`/api/taim/menu/versions/${id}/publish`).send(body)
const draftDish = (versionId, name) => prisma.menuItem.findFirstOrThrow({ where: { versionId, name } })

/** A closed take-out bill with these dishes, served */
async function closedBill(dishes, { status = 'SENT_OUT' } = {}) {
    const waiter = await prisma.staff.findFirstOrThrow({ where: { role: 'WAITER' } })
    const at = new Date(Date.now() - 3_600_000)
    return prisma.order.create({
        data: {
            type: 'TAKEOUT',
            customerName: 'Dana',
            status: 'CLOSED',
            openedById: waiter.id,
            openedAt: at,
            closedAt: new Date(),
            items: { create: dishes.map((dish) => ({ menuItemId: dish.id, price: dish.price, status, firedAt: at, round: 1, startedAt: at, sentOutAt: at })) },
        },
    })
}

describe('starting a draft (editMenu: Manager, Chef)', () => {
    it('copies the menu in use: categories, dishes, prices, prep times and sold out, each dish keeping its key', async () => {
        const res = await startDraft({ name: ' Autumn menu ', season: 'Autumn', note: 'Warmer dishes' }).expect(201)
        expect(res.body).toMatchObject({ number: 2, name: 'Autumn menu', season: 'Autumn', note: 'Warmer dishes', status: 'DRAFT', basedOnId: 1, activeFrom: null, createdBy: { name: expect.any(String) } })

        const copy = await prisma.menuItem.findMany({ where: { versionId: res.body.id }, orderBy: { position: 'asc' } })
        expect(copy.map((d) => [d.name, d.price, d.prepMinutes, d.hidden])).toEqual([['Shakshuka', 1400, 10, false], ['Schnitzel', 1800, null, true]])
        expect(copy[0].dishKey).toBe(shakshuka.dishKey)
        expect(copy[0].id).not.toBe(shakshuka.id)
    })

    it('one draft at a time: a second one gets 409', async () => {
        await startDraft().expect(201)
        const res = await startDraft({ name: 'Another' }, manager).expect(409)
        expect(res.body.error).toBe('There is already a draft (or a scheduled menu): finish or discard it first')
    })

    it('Cook, Host and Waiter cannot see or start versions (403)', async () => {
        for (const role of ['COOK', 'HOST', 'WAITER']) {
            const agent = await as(role)
            await agent.get('/api/taim/menu/versions').expect(403)
            await startDraft(undefined, agent).expect(403)
        }
        expect(await prisma.menuVersion.count()).toBe(1)
    })

    it('checks the name, season and note', async () => {
        const res = await startDraft({ name: ' ', season: 'x'.repeat(31), note: 'x'.repeat(201) }).expect(400)
        expect(res.body.fields).toEqual({ name: 'Name is required', season: 'Max 30 characters', note: 'Max 200 characters' })
    })

    it('renames a draft; an empty season is saved as none', async () => {
        const draft = (await startDraft({ name: 'Autumn', season: 'Autumn' }).expect(201)).body
        const res = await manager.patch(`/api/taim/menu/versions/${draft.id}`).send({ name: 'Autumn 2026', season: '' }).expect(200)
        expect(res.body).toMatchObject({ name: 'Autumn 2026', season: null })
        await manager.patch('/api/taim/menu/versions/999').send({ name: 'x' }).expect(404)
    })
})

describe('publishing (publishMenu: Manager, Chef)', () => {
    it('Cook, Host and Waiter cannot publish (403); the Chef publishes now and the old menu is archived', async () => {
        const draft = (await startDraft().expect(201)).body
        await chef.patch(`/api/taim/menu-items/${(await draftDish(draft.id, 'Shakshuka')).id}`).send({ price: 1500 }).expect(200)
        for (const role of ['COOK', 'HOST', 'WAITER']) await publish(draft.id, {}, await as(role)).expect(403)

        const res = await publish(draft.id).expect(200)
        expect(res.body).toMatchObject({ status: 'ACTIVE', activeFrom: expect.any(String), publishedBy: { name: expect.any(String) } })
        const old = await prisma.menuVersion.findUniqueOrThrow({ where: { id: 1 } })
        expect(old.status).toBe('ARCHIVED')
        expect(old.activeTo.toISOString()).toBe(res.body.activeFrom)

        const menu = (await (await as('WAITER')).get('/api/taim/menu').expect(200)).body
        expect(menu[0].items.map((d) => [d.name, d.price])).toEqual([['Shakshuka', 1500], ['Schnitzel', 1800]])
    })

    it('the Manager can publish too', async () => {
        const draft = (await startDraft(undefined, manager).expect(201)).body
        const res = await publish(draft.id, {}, manager).expect(200)
        expect(res.body).toMatchObject({ status: 'ACTIVE', publishedBy: { name: 'Noa' } })
    })

    it('a bill keeps the dish of the menu it was ordered from', async () => {
        const bill = await closedBill([shakshuka])
        const draft = (await startDraft().expect(201)).body
        await chef.patch(`/api/taim/menu-items/${(await draftDish(draft.id, 'Shakshuka')).id}`).send({ name: 'Green shakshuka' }).expect(200)
        await publish(draft.id).expect(200)

        const line = await prisma.orderItem.findFirstOrThrow({ where: { orderId: bill.id }, include: { menuItem: true } })
        expect(line.menuItem).toMatchObject({ versionId: 1, name: 'Shakshuka' })
    })

    it('refuses an empty draft, and a version that is not the draft', async () => {
        const draft = (await startDraft().expect(201)).body
        for (const dish of await prisma.menuItem.findMany({ where: { versionId: draft.id } })) {
            await chef.delete(`/api/taim/menu-items/${dish.id}`).expect(204)
        }
        expect((await publish(draft.id).expect(409)).body.error).toBe('The draft has no dishes yet')
        expect((await publish(1).expect(409)).body.error).toBe('Only the draft can be published')
    })

    it('a dish leaves only the draft: dishes of the menu in use cannot be removed', async () => {
        const res = await chef.delete(`/api/taim/menu-items/${shakshuka.id}`).expect(409)
        expect(res.body.error).toBe('Only a dish of the draft can be removed: on the menu in use, mark it sold out')
        await chef.delete('/api/taim/menu-items/999').expect(404)
    })

    it('discarding the draft takes its dishes with it; the menu in use can not be discarded', async () => {
        const draft = (await startDraft().expect(201)).body
        await manager.delete(`/api/taim/menu/versions/${draft.id}`).expect(204)
        expect(await prisma.menuItem.count()).toBe(2)
        await manager.delete('/api/taim/menu/versions/1').expect(409)
        await manager.delete('/api/taim/menu/versions/999').expect(404)
    })
})

describe('publishing on a date', () => {
    const tomorrow = () => new Date(Date.now() + 86_400_000)

    it('is scheduled until then: the menu in use stays, no new draft meanwhile', async () => {
        const draft = (await startDraft().expect(201)).body
        const startsAt = tomorrow()
        const res = await publish(draft.id, { startsAt: startsAt.toISOString() }).expect(200)
        expect(res.body).toMatchObject({ status: 'SCHEDULED', activeFrom: startsAt.toISOString() })

        expect((await chef.get('/api/taim/menu').expect(200)).body[0].id).not.toBe(draft.id)
        await startDraft({ name: 'Another' }).expect(409)
        // Scheduled = published: no more changes to it
        await chef.patch(`/api/taim/menu-items/${(await draftDish(draft.id, 'Shakshuka')).id}`).send({ price: 1 }).expect(409)
    })

    it('switches by itself when the date comes, starting at that date', async () => {
        const draft = (await startDraft().expect(201)).body
        const startsAt = tomorrow()
        await publish(draft.id, { startsAt }).expect(200)
        expect(await applyDueVersion(new Date())).toBeNull()

        expect(await applyDueVersion(new Date(startsAt.getTime() + 1000))).toBe(draft.id)
        const [old, next] = await prisma.menuVersion.findMany({ orderBy: { id: 'asc' } })
        expect(old).toMatchObject({ status: 'ARCHIVED', activeTo: startsAt })
        expect(next).toMatchObject({ status: 'ACTIVE', activeFrom: startsAt })
    })

    it('unschedule: back to a draft that can change again (Manager or Chef)', async () => {
        const draft = (await startDraft().expect(201)).body
        await publish(draft.id, { startsAt: tomorrow() }).expect(200)
        await (await as('WAITER')).post(`/api/taim/menu/versions/${draft.id}/unschedule`).expect(403)
        await manager.post(`/api/taim/menu/versions/${draft.id}/unschedule`).expect(204)

        const back = await prisma.menuVersion.findUniqueOrThrow({ where: { id: draft.id } })
        expect(back).toMatchObject({ status: 'DRAFT', activeFrom: null, publishedAt: null })
        await chef.patch(`/api/taim/menu-items/${(await draftDish(draft.id, 'Shakshuka')).id}`).send({ price: 1500 }).expect(200)
        await chef.post(`/api/taim/menu/versions/${draft.id}/unschedule`).expect(409)
    })

    it('a start in the past publishes now', async () => {
        const draft = (await startDraft().expect(201)).body
        const res = await publish(draft.id, { startsAt: new Date(Date.now() - 60_000) }).expect(200)
        expect(res.body.status).toBe('ACTIVE')
    })
})

describe('using an older menu again (publishMenu: Manager, Chef)', () => {
    /** Version 1 archived, version 2 (Shakshuka at $15, Schnitzel removed) in use */
    async function twoMenus() {
        const draft = (await startDraft().expect(201)).body
        await chef.patch(`/api/taim/menu-items/${(await draftDish(draft.id, 'Shakshuka')).id}`).send({ price: 1500 }).expect(200)
        await chef.delete(`/api/taim/menu-items/${(await draftDish(draft.id, 'Schnitzel')).id}`).expect(204)
        await publish(draft.id).expect(200)
        return draft
    }

    it('brings it back as a new version, in use from now; the one in use is archived', async () => {
        const second = await twoMenus()
        const res = await manager.post('/api/taim/menu/versions/1/use').expect(200)
        expect(res.body).toMatchObject({ number: 3, name: 'Test menu', note: 'Back from #1', status: 'ACTIVE', basedOnId: 1, publishedBy: { name: 'Noa' } })

        expect((await prisma.menuVersion.findUniqueOrThrow({ where: { id: second.id } })).status).toBe('ARCHIVED')
        expect((await prisma.menuVersion.findUniqueOrThrow({ where: { id: 1 } })).status).toBe('ARCHIVED')
        const menu = (await (await as('WAITER')).get('/api/taim/menu').expect(200)).body
        // Its dishes and prices, every dish on the menu again (sold out starts fresh)
        expect(menu[0].items.map((d) => [d.name, d.price, d.hidden])).toEqual([['Shakshuka', 1400, false], ['Schnitzel', 1800, false]])
        const copy = await prisma.menuItem.findFirstOrThrow({ where: { versionId: res.body.id, name: 'Shakshuka' } })
        expect(copy.dishKey).toBe(shakshuka.dishKey)
    })

    it('only an older menu (409), only Manager and Chef (403); a draft stays as it is', async () => {
        const second = await twoMenus()
        const draft = (await startDraft({ name: 'Winter' }).expect(201)).body
        for (const role of ['COOK', 'HOST', 'WAITER']) await (await as(role)).post('/api/taim/menu/versions/1/use').expect(403)
        expect((await chef.post(`/api/taim/menu/versions/${second.id}/use`).expect(409)).body.error).toBe('Only an older menu can be used again')
        await chef.post(`/api/taim/menu/versions/${draft.id}/use`).expect(409)
        await chef.post('/api/taim/menu/versions/999/use').expect(404)

        await chef.post('/api/taim/menu/versions/1/use').expect(200)
        expect((await prisma.menuVersion.findUniqueOrThrow({ where: { id: draft.id } })).status).toBe('DRAFT')
    })
})

describe('GET /api/taim/menu/versions', () => {
    it('lists versions newest first with what changed, income and the best one', async () => {
        await closedBill([shakshuka, shakshuka])
        await closedBill([shakshuka], { status: 'CAME_BACK' }) // came back: no income, counts as a return

        const draft = (await startDraft({ name: 'Autumn menu', season: 'Autumn' }).expect(201)).body
        await chef.patch(`/api/taim/menu-items/${(await draftDish(draft.id, 'Shakshuka')).id}`).send({ price: 1500 }).expect(200)
        await chef.delete(`/api/taim/menu-items/${(await draftDish(draft.id, 'Schnitzel')).id}`).expect(204)
        const mains = await prisma.menuCategory.findFirstOrThrow({ where: { versionId: draft.id } })
        await chef.post('/api/taim/menu-items').send({ categoryId: mains.id, name: 'Sabich', price: 1200 }).expect(201)
        await publish(draft.id).expect(200)

        const res = await manager.get('/api/taim/menu/versions').expect(200)
        const [autumn, first] = res.body.versions
        expect(autumn).toMatchObject({ name: 'Autumn menu', season: 'Autumn', status: 'ACTIVE', dishCount: 2 })
        expect(autumn.changes).toEqual([
            { type: 'added', name: 'Sabich', price: 1200, category: 'Mains' },
            { type: 'changed', name: 'Shakshuka', fields: { price: { from: 1400, to: 1500 } } },
            { type: 'removed', name: 'Schnitzel', price: 1800, category: 'Mains' },
        ])
        expect(first).toMatchObject({ number: 1, status: 'ARCHIVED', changes: null })
        expect(first.stats).toMatchObject({ income: 2800, bills: 1, averageBill: 2800, dishesSold: 2, days: 1, perDay: 2800, returnRate: 33.3 })
        expect(first.stats.topDishes).toEqual([{ name: 'Shakshuka', count: 2 }])
        expect(autumn.stats.income).toBe(0)
        expect(res.body).toMatchObject({ bestId: 1, lastId: 1 })
    })

    it('compares any two versions, either way round', async () => {
        const draft = (await startDraft().expect(201)).body
        await chef.patch(`/api/taim/menu-items/${(await draftDish(draft.id, 'Shakshuka')).id}`).send({ price: 1500 }).expect(200)
        const res = await manager.get(`/api/taim/menu/versions/compare?from=${draft.id}&to=1`).expect(200)
        expect(res.body.changes).toEqual([{ type: 'changed', name: 'Shakshuka', fields: { price: { from: 1500, to: 1400 } } }])
        await manager.get('/api/taim/menu/versions/compare?from=1&to=999').expect(404)
        await manager.get('/api/taim/menu/versions/compare?from=1').expect(400)
    })

    it('GET one version: its categories and dishes', async () => {
        const res = await manager.get('/api/taim/menu/versions/1').expect(200)
        expect(res.body.categories[0].items.map((d) => d.name)).toEqual(['Shakshuka', 'Schnitzel'])
        await manager.get('/api/taim/menu/versions/999').expect(404)
    })
})

describe('the database keeps the versions straight', () => {
    it('only one menu in use, one draft', async () => {
        await expect(prisma.menuVersion.create({ data: { number: 2, name: 'Two', status: 'ACTIVE', activeFrom: new Date() } })).rejects.toThrow()
        await prisma.menuVersion.create({ data: { number: 2, name: 'Draft', status: 'DRAFT' } })
        await expect(prisma.menuVersion.create({ data: { number: 3, name: 'Draft 2', status: 'DRAFT' } })).rejects.toThrow()
    })

    it('dates fit the status: a draft has none, an archived one ends after it starts', async () => {
        await expect(prisma.menuVersion.create({ data: { number: 2, name: 'x', status: 'DRAFT', activeFrom: new Date() } })).rejects.toThrow(/menu_versions_dates/)
        await expect(
            prisma.menuVersion.create({ data: { number: 2, name: 'x', status: 'ARCHIVED', activeFrom: new Date(), activeTo: new Date(Date.now() - 86_400_000) } })
        ).rejects.toThrow(/menu_versions_dates/)
    })
})
