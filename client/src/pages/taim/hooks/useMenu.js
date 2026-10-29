import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

/**
 * The menu (GET /api/taim/menu) plus the actions that change it. Each action
 * waits for the server, then updates the local copy with what it returned,
 * so the screen always shows what's really saved. Actions throw on failure
 * (err.fields has per-field messages) so forms can show them.
 *
 * reorderDishes is the exception: it shows the new order straight away (so
 * a drag feels instant) and puts the old order back if the server refuses.
 *
 * @returns {{ categories: object[]|null, error: string, reload: () => void,
 *   createCategory, renameCategory, deleteCategory, createDish, updateDish, reorderDishes }}
 */
export function useMenu() {
    const [categories, setCategories] = useState(null) // null = still loading
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false
        api('/menu')
            .then((data) => { if (!cancelled) { setCategories(data); setError('') } })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [attempt])

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    const createCategory = useCallback(async (name) => {
        const category = await api('/categories', { method: 'POST', body: { name } })
        setCategories((list) => [...list, category])
    }, [])

    const renameCategory = useCallback(async (id, name) => {
        const updated = await api(`/categories/${id}`, { method: 'PATCH', body: { name } })
        setCategories((list) => list.map((c) => (c.id === id ? { ...c, name: updated.name } : c)))
    }, [])

    const deleteCategory = useCallback(async (id) => {
        await api(`/categories/${id}`, { method: 'DELETE' })
        setCategories((list) => list.filter((c) => c.id !== id))
    }, [])

    // A dish lives inside its category: put the saved copy there. A dish
    // that's new to a category (just added, or moved in) goes to the top,
    // as the server put it.
    const placeDish = (list, dish) =>
        list.map((c) => {
            const others = c.items.filter((item) => item.id !== dish.id)
            if (c.id !== dish.categoryId) return others.length === c.items.length ? c : { ...c, items: others }
            const at = c.items.findIndex((item) => item.id === dish.id)
            const items = at === -1 ? [dish, ...c.items] : c.items.map((item) => (item.id === dish.id ? dish : item))
            return { ...c, items }
        })

    const createDish = useCallback(async (data) => {
        const dish = await api('/menu-items', { method: 'POST', body: data })
        setCategories((list) => placeDish(list, dish))
    }, [])

    const updateDish = useCallback(async (id, data) => {
        const dish = await api(`/menu-items/${id}`, { method: 'PATCH', body: data })
        setCategories((list) => placeDish(list, dish))
    }, [])

    /** New order for one category's dishes (ids, top first), e.g. after a drag */
    const reorderDishes = useCallback(async (categoryId, dishIds) => {
        let before
        setCategories((list) => {
            before = list
            return list.map((c) => {
                if (c.id !== categoryId) return c
                const byId = new Map(c.items.map((item) => [item.id, item]))
                return { ...c, items: dishIds.map((id) => byId.get(id)) }
            })
        })
        try {
            const items = await api(`/categories/${categoryId}/dish-order`, { method: 'PUT', body: { dishIds } })
            setCategories((list) => list.map((c) => (c.id === categoryId ? { ...c, items } : c)))
        } catch (err) {
            setCategories(before) // the server said no: back to the saved order
            throw err
        }
    }, [])

    return { categories, error, reload, createCategory, renameCategory, deleteCategory, createDish, updateDish, reorderDishes }
}
