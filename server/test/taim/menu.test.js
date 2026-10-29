import { describe, it, expect, beforeEach } from 'vitest'
import { anonymous, resetTaim, as, prisma } from './helpers.js'

let chef
let mains

beforeEach(async () => {
    await resetTaim()
    chef = await as('CHEF')
    mains = await prisma.menuCategory.create({
        data: {
            name: 'Mains',
            position: 1,
            items: { create: [{ name: 'Shakshuka', price: 1400 }, { name: 'Schnitzel', price: 1800, hidden: true }] },
        },
    })
})

const newDish = (overrides = {}) => ({ categoryId: mains.id, name: 'Sabich', price: 1200, ...overrides })

describe('GET /api/taim/menu', () => {
    it('needs a picked person', async () => {
        await anonymous.get('/api/taim/menu').expect(401)
    })

    it('every role can read it: categories in order, hidden dishes marked', async () => {
        await prisma.menuCategory.create({ data: { name: 'Starters', position: 0 } })
        const cook = await as('COOK')
        const res = await cook.get('/api/taim/menu').expect(200)

        expect(res.body.map((c) => c.name)).toEqual(['Starters', 'Mains'])
        expect(res.body[1].items).toEqual([
            { id: expect.any(Number), categoryId: mains.id, name: 'Shakshuka', description: null, price: 1400, hidden: false },
            { id: expect.any(Number), categoryId: mains.id, name: 'Schnitzel', description: null, price: 1800, hidden: true },
        ])
    })
})

describe('who may change the menu', () => {
    it('Chef and Manager can add a dish', async () => {
        await chef.post('/api/taim/menu-items').send(newDish()).expect(201)
        const manager = await as('MANAGER')
        await manager.post('/api/taim/menu-items').send(newDish({ name: 'Kebab' })).expect(201)
    })

    it('Cook, Host and Waiter get 403 and nothing changes', async () => {
        for (const role of ['COOK', 'HOST', 'WAITER']) {
            const agent = await as(role)
            const res = await agent.post('/api/taim/menu-items').send(newDish()).expect(403)
            expect(res.body.error).toBe("Your role can't do this")
            await agent.patch(`/api/taim/categories/${mains.id}`).send({ name: 'Big plates' }).expect(403)
        }
        expect(await prisma.menuItem.count()).toBe(2)
        expect((await prisma.menuCategory.findUniqueOrThrow({ where: { id: mains.id } })).name).toBe('Mains')
    })
})

describe('POST /api/taim/menu-items', () => {
    it('creates a dish, trimming text and saving an empty description as none', async () => {
        const res = await chef.post('/api/taim/menu-items').send(newDish({ name: '  Sabich ', description: '  ' })).expect(201)
        expect(res.body).toEqual({ id: expect.any(Number), categoryId: mains.id, name: 'Sabich', description: null, price: 1200, hidden: false })
    })

    it('rejects a missing name, a zero price and cents with decimals', async () => {
        const res = await chef.post('/api/taim/menu-items').send({ categoryId: mains.id, price: 0 }).expect(400)
        expect(res.body.fields).toEqual({ name: 'Name is required', price: 'Price must be more than 0' })
        const decimals = await chef.post('/api/taim/menu-items').send(newDish({ price: 12.5 })).expect(400)
        expect(decimals.body.fields.price).toBe('Use whole cents')
    })

    it('rejects a category that does not exist', async () => {
        const res = await chef.post('/api/taim/menu-items').send(newDish({ categoryId: 999 })).expect(400)
        expect(res.body.fields).toEqual({ categoryId: 'Category not found' })
    })

    it('rejects a name that is already on the menu with 409', async () => {
        const res = await chef.post('/api/taim/menu-items').send(newDish({ name: 'Shakshuka' })).expect(409)
        expect(res.body.fields).toEqual({ name: 'There is already a dish with this name' })
    })
})

describe('the database itself refuses a free dish', () => {
    it('even when the API is bypassed', async () => {
        await expect(prisma.menuItem.create({ data: { categoryId: mains.id, name: 'Free', price: 0 } })).rejects.toThrow(/menu_items_price_positive/)
    })
})

describe('PATCH /api/taim/menu-items/:id', () => {
    it('changes the price and marks a dish sold out (hidden)', async () => {
        const dish = await prisma.menuItem.findFirstOrThrow({ where: { name: 'Shakshuka' } })
        const res = await chef.patch(`/api/taim/menu-items/${dish.id}`).send({ price: 1500, hidden: true }).expect(200)
        expect(res.body).toMatchObject({ price: 1500, hidden: true })
    })

    it('answers 404 for a dish that does not exist, 400 for an empty change', async () => {
        await chef.patch('/api/taim/menu-items/999').send({ price: 1500 }).expect(404)
        const dish = await prisma.menuItem.findFirstOrThrow()
        const res = await chef.patch(`/api/taim/menu-items/${dish.id}`).send({}).expect(400)
        expect(res.body.fields).toEqual({ _: 'Nothing to update' })
    })
})

describe('categories', () => {
    it('a new category goes to the end of the menu', async () => {
        const res = await chef.post('/api/taim/categories').send({ name: 'Desserts' }).expect(201)
        expect(res.body).toMatchObject({ name: 'Desserts', position: 2, items: [] })
    })

    it('rejects a duplicate name with 409, and renames', async () => {
        await chef.post('/api/taim/categories').send({ name: 'Mains' }).expect(409)
        const res = await chef.patch(`/api/taim/categories/${mains.id}`).send({ name: 'Big plates' }).expect(200)
        expect(res.body.name).toBe('Big plates')
    })

    it('only deletes an empty category', async () => {
        const res = await chef.delete(`/api/taim/categories/${mains.id}`).expect(409)
        expect(res.body.error).toMatch(/Only an empty category/)

        const empty = await chef.post('/api/taim/categories').send({ name: 'Specials' }).expect(201)
        await chef.delete(`/api/taim/categories/${empty.body.id}`).expect(204)
    })
})
