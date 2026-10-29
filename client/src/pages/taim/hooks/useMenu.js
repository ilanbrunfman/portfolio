import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

/**
 * The menu (GET /api/taim/menu) plus the actions that change it. Each action
 * waits for the server, then updates the local copy with what it returned,
 * so the screen always shows what's really saved. Actions throw on failure
 * (err.fields has per-field messages) so forms can show them.
 *
 * @returns {{ categories: object[]|null, error: string, reload: () => void,
 *   createCategory, renameCategory, deleteCategory, createDish, updateDish }}
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

    // A dish lives inside its category: put the saved copy there (moving it
    // if its category changed)
    const placeDish = (list, dish) =>
        list.map((c) => {
            const others = c.items.filter((item) => item.id !== dish.id)
            if (c.id !== dish.categoryId) return others.length === c.items.length ? c : { ...c, items: others }
            const at = c.items.findIndex((item) => item.id === dish.id)
            const items = at === -1 ? [...c.items, dish] : c.items.map((item) => (item.id === dish.id ? dish : item))
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

    return { categories, error, reload, createCategory, renameCategory, deleteCategory, createDish, updateDish }
}
