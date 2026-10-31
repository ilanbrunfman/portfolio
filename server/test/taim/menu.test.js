import { describe, it, expect, beforeEach } from 'vitest'
import { anonymous, resetTaim, as, prisma } from './helpers.js'

// Step 3.1: the menu in use (version 1, ACTIVE) only changes when a draft is
// published. Every change below happens in the draft the Chef starts first;
// `live` is the Mains category of the menu in use, `mains` its draft copy.
let chef
let live
let draft
let mains

beforeEach(async () => {
    await resetTaim()
    chef = await as('CHEF')
    live = await prisma.menuCategory.create({
        data: {
            versionId: 1,
            name: 'Mains',
            position: 1,
            items: { create: [{ name: 'Shakshuka', price: 1400, position: 1 }, { name: 'Schnitzel', price: 1800, hidden: true, position: 2 }] },
        },
    })
    draft = (await chef.post('/api/taim/menu/versions').send({ name: 'Next menu' }).expect(201)).body
    mains = await prisma.menuCategory.findFirstOrThrow({ where: { versionId: draft.id, name: 'Mains' } })
})

/** The draft's categories with their dishes, in menu order */
const draftMenu = async (agent = chef) => (await agent.get(`/api/taim/menu/versions/${draft.id}`).expect(200)).body.categories

const newDish = (overrides = {}) => ({ categoryId: mains.id, name: 'Sabich', price: 1200, ...overrides })

describe('GET /api/taim/menu', () => {
    it('needs a picked person', async () => {
        await anonymous.get('/api/taim/menu').expect(401)
    })

    it('every role can read it: categories in order, hidden dishes marked', async () => {
        await prisma.menuCategory.create({ data: { versionId: 1, name: 'Starters', position: 0 } })
        const cook = await as('COOK')
        const res = await cook.get('/api/taim/menu').expect(200)

        expect(res.body.map((c) => c.name)).toEqual(['Starters', 'Mains'])
        expect(res.body[1].items).toEqual([
            { id: expect.any(Number), categoryId: live.id, name: 'Shakshuka', description: null, price: 1400, prepMinutes: null, hidden: false, allergens: [], position: 1 },
            { id: expect.any(Number), categoryId: live.id, name: 'Schnitzel', description: null, price: 1800, prepMinutes: null, hidden: true, allergens: [], position: 2 },
        ])
    })

    it('shows the menu in use, not the draft', async () => {
        await chef.post('/api/taim/categories').send({ name: 'Desserts' }).expect(201)
        const res = await chef.get('/api/taim/menu').expect(200)
        expect(res.body.map((c) => c.id)).toEqual([live.id])
    })
})

describe('the menu in use changes only through a draft', () => {
    it('refuses dish, price and category changes on it with 409, but sold out works', async () => {
        const dish = await prisma.menuItem.findFirstOrThrow({ where: { name: 'Shakshuka' } })
        const price = await chef.patch(`/api/taim/menu-items/${dish.id}`).send({ price: 1500 }).expect(409)
        expect(price.body.error).toBe('Change the draft: on the menu in use only sold out and allergens can change')
        await chef.patch(`/api/taim/menu-items/${dish.id}`).send({ hidden: true, name: 'Other' }).expect(409)
        const add = await chef.post('/api/taim/menu-items').send({ categoryId: live.id, name: 'Sabich', price: 1200 }).expect(409)
        expect(add.body.error).toBe('Change the draft: the menu in use changes only when a draft is published')
        await chef.patch(`/api/taim/categories/${live.id}`).send({ name: 'Big plates' }).expect(409)
        await chef.delete(`/api/taim/categories/${live.id}`).expect(409)
        await chef.put(`/api/taim/categories/${live.id}/dish-order`).send({ dishIds: [dish.id] }).expect(409)

        const soldOut = await chef.patch(`/api/taim/menu-items/${dish.id}`).send({ hidden: true }).expect(200)
        expect(soldOut.body).toMatchObject({ name: 'Shakshuka', price: 1400, hidden: true })
    })

    it('without a draft, adding a category asks to start one', async () => {
        await chef.delete(`/api/taim/menu/versions/${draft.id}`).expect(204)
        const res = await chef.post('/api/taim/categories').send({ name: 'Desserts' }).expect(409)
        expect(res.body.error).toBe('Start a draft first: the menu in use changes only when a draft is published')
    })

    it('a dish cannot move into a category of another version', async () => {
        const dish = await prisma.menuItem.findFirstOrThrow({ where: { versionId: draft.id, name: 'Shakshuka' } })
        await chef.patch(`/api/taim/menu-items/${dish.id}`).send({ categoryId: live.id }).expect(409)
        // …and the database refuses it too (the category must be of the dish's version)
        await expect(prisma.menuItem.update({ where: { id: dish.id }, data: { categoryId: live.id } })).rejects.toThrow()
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
        expect(await prisma.menuItem.count({ where: { versionId: draft.id } })).toBe(2)
        expect((await prisma.menuCategory.findUniqueOrThrow({ where: { id: mains.id } })).name).toBe('Mains')
    })
})

describe('POST /api/taim/menu-items', () => {
    it('creates a dish, trimming text and saving an empty description as none', async () => {
        const res = await chef.post('/api/taim/menu-items').send(newDish({ name: '  Sabich ', description: '  ' })).expect(201)
        expect(res.body).toEqual({ id: expect.any(Number), categoryId: mains.id, name: 'Sabich', description: null, price: 1200, prepMinutes: null, hidden: false, allergens: [], position: 1 })
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
        await expect(prisma.menuItem.create({ data: { versionId: draft.id, categoryId: mains.id, name: 'Free', price: 0, position: 3 } })).rejects.toThrow(/menu_items_price_positive/)
    })
})

describe('PATCH /api/taim/menu-items/:id', () => {
    it('changes the price and marks a dish sold out (hidden)', async () => {
        const dish = await prisma.menuItem.findFirstOrThrow({ where: { versionId: draft.id, name: 'Shakshuka' } })
        const res = await chef.patch(`/api/taim/menu-items/${dish.id}`).send({ price: 1500, hidden: true }).expect(200)
        expect(res.body).toMatchObject({ price: 1500, hidden: true })
        // The menu in use keeps its price until the draft is published
        expect((await prisma.menuItem.findFirstOrThrow({ where: { name: 'Shakshuka' } })).price).toBe(1400)
    })

    it('answers 404 for a dish that does not exist, 400 for an empty change', async () => {
        await chef.patch('/api/taim/menu-items/999').send({ price: 1500 }).expect(404)
        const dish = await prisma.menuItem.findFirstOrThrow({ where: { versionId: draft.id } })
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

describe('dish order', () => {
    const names = async (agent = chef) => (await draftMenu(agent)).find((c) => c.id === mains.id).items.map((d) => d.name)
    const idsOf = async (...wanted) => {
        const dishes = await prisma.menuItem.findMany({ where: { categoryId: mains.id } })
        return wanted.map((name) => dishes.find((d) => d.name === name).id)
    }

    it('lists dishes by position, and a new dish goes to the top', async () => {
        expect(await names()).toEqual(['Shakshuka', 'Schnitzel'])
        await chef.post('/api/taim/menu-items').send(newDish()).expect(201)
        expect(await names()).toEqual(['Sabich', 'Shakshuka', 'Schnitzel'])
    })

    it('saves a new order for the whole category', async () => {
        await chef.post('/api/taim/menu-items').send(newDish()).expect(201)
        const ids = await idsOf('Schnitzel', 'Sabich', 'Shakshuka')
        const res = await chef.put(`/api/taim/categories/${mains.id}/dish-order`).send({ dishIds: ids }).expect(200)

        expect(res.body.map((d) => [d.name, d.position])).toEqual([['Schnitzel', 1], ['Sabich', 2], ['Shakshuka', 3]])
        expect(await names(await as('MANAGER'))).toEqual(['Schnitzel', 'Sabich', 'Shakshuka'])
    })

    it('refuses a list that is not exactly the category\'s dishes, and changes nothing', async () => {
        const [shakshuka, schnitzel] = await idsOf('Shakshuka', 'Schnitzel')
        const desserts = await prisma.menuCategory.create({
            data: { versionId: draft.id, name: 'Desserts', position: 2, items: { create: [{ name: 'Malabi', price: 700, position: 1 }] } },
            include: { items: true },
        })
        const url = `/api/taim/categories/${mains.id}/dish-order`

        for (const dishIds of [[schnitzel], [schnitzel, shakshuka, desserts.items[0].id], [schnitzel, 999]]) {
            const res = await chef.put(url).send({ dishIds }).expect(400)
            expect(res.body.fields).toEqual({ dishIds: 'Send every dish of this category exactly once' })
        }
        const dup = await chef.put(url).send({ dishIds: [schnitzel, schnitzel] }).expect(400)
        expect(dup.body.fields).toEqual({ dishIds: 'Each dish can appear only once' })

        expect(await names()).toEqual(['Shakshuka', 'Schnitzel'])
    })

    it('answers 404 for a category that does not exist, 403 for a Cook', async () => {
        const ids = await idsOf('Schnitzel', 'Shakshuka')
        await chef.put('/api/taim/categories/999/dish-order').send({ dishIds: ids }).expect(404)
        const cook = await as('COOK')
        await cook.put(`/api/taim/categories/${mains.id}/dish-order`).send({ dishIds: ids }).expect(403)
        expect(await names()).toEqual(['Shakshuka', 'Schnitzel'])
    })

    it('a dish moved to another category lands at its top', async () => {
        const desserts = await prisma.menuCategory.create({
            data: { versionId: draft.id, name: 'Desserts', position: 2, items: { create: [{ name: 'Malabi', price: 700, position: 1 }] } },
        })
        const [shakshuka] = await idsOf('Shakshuka')
        const res = await chef.patch(`/api/taim/menu-items/${shakshuka}`).send({ categoryId: desserts.id }).expect(200)
        expect(res.body).toMatchObject({ categoryId: desserts.id, position: 1 })

        const menu = await draftMenu()
        expect(menu.find((c) => c.id === desserts.id).items.map((d) => d.name)).toEqual(['Shakshuka', 'Malabi'])
    })
})

describe('allergens (step 5.4)', () => {
    it('the Chef tags a dish; they come back known, once each, in a fixed order', async () => {
        const res = await chef.post('/api/taim/menu-items').send(newDish({ allergens: ['SESAME', 'GLUTEN', 'SESAME'] })).expect(201)
        expect(res.body.allergens).toEqual(['GLUTEN', 'SESAME'])
        const bad = await chef.post('/api/taim/menu-items').send(newDish({ name: 'Kebab', allergens: ['NUTS'] })).expect(400)
        expect(bad.body.fields['allergens.0']).toBe('Unknown allergen')
    })

    it('can be fixed on the menu in use at once (safety), unlike prices', async () => {
        const dish = await prisma.menuItem.findFirstOrThrow({ where: { versionId: 1, name: 'Shakshuka' } })
        const res = await chef.patch(`/api/taim/menu-items/${dish.id}`).send({ allergens: ['EGG'] }).expect(200)
        expect(res.body.allergens).toEqual(['EGG'])
        await chef.patch(`/api/taim/menu-items/${dish.id}`).send({ allergens: ['EGG'], price: 1 }).expect(409)
    })

    it('a new draft copies them', async () => {
        const dish = await prisma.menuItem.findFirstOrThrow({ where: { versionId: 1, name: 'Shakshuka' } })
        await chef.patch(`/api/taim/menu-items/${dish.id}`).send({ allergens: ['EGG', 'GLUTEN'] }).expect(200)
        await chef.delete(`/api/taim/menu/versions/${draft.id}`).expect(204)
        const next = (await chef.post('/api/taim/menu/versions').send({ name: 'Again' }).expect(201)).body
        expect((await prisma.menuItem.findFirstOrThrow({ where: { versionId: next.id, name: 'Shakshuka' } })).allergens).toEqual(['GLUTEN', 'EGG'])
    })
})

describe('prep time', () => {
    it('the Chef sets how long a dish should take, or clears it', async () => {
        const created = await chef.post('/api/taim/menu-items').send(newDish({ prepMinutes: 8 })).expect(201)
        expect(created.body.prepMinutes).toBe(8)
        const cleared = await chef.patch(`/api/taim/menu-items/${created.body.id}`).send({ prepMinutes: null }).expect(200)
        expect(cleared.body.prepMinutes).toBeNull()
    })

    it('must be 1 to 180 whole minutes, also in the database', async () => {
        for (const prepMinutes of [0, 181, 2.5]) await chef.post('/api/taim/menu-items').send(newDish({ prepMinutes })).expect(400)
        const dish = await prisma.menuItem.findFirstOrThrow({ where: { versionId: draft.id } })
        await expect(prisma.menuItem.update({ where: { id: dish.id }, data: { prepMinutes: 0 } })).rejects.toThrow(/menu_items_prep_minutes_range/)
    })
})

