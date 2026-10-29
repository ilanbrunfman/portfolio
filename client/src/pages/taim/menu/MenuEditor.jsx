import { useState } from 'react'
import { useMenu } from '@/pages/taim/hooks/useMenu'
import DishForm from '@/pages/taim/components/dish-form/DishForm'
import CategoryForm from '@/pages/taim/components/category-form/CategoryForm'
import DishList from '@/pages/taim/components/dish-list/DishList'
import Accordion from '@/components/ui/accordion/Accordion'
import Modal from '@/components/ui/modal/Modal'
import Button from '@/components/ui/button/Button'
import './MenuEditor.scss'

/**
 * /taim/menu – the Manager's and Chef's menu: each category is an
 * accordion section (Rename and + Dish in its header) that opens to its
 * dishes, one row each, dragged by a grip to reorder (see DishList).
 * (The route only renders this for roles with the editMenu right; the
 * server refuses changes from anyone else.)
 */
const MenuEditor = () => {
    const menu = useMenu()
    const { categories } = menu
    // What the modal shows: { kind: 'dish' | 'category', item?, categoryId? } or null
    const [editing, setEditing] = useState(null)
    // Open categories; null = untouched, so every category starts open
    const [openIds, setOpenIds] = useState(null)
    const [toggling, setToggling] = useState(null) // id of the dish being switched on/off
    const [error, setError] = useState('')
    const close = () => setEditing(null)

    const openCategories = openIds ?? new Set(categories?.map((c) => c.id))
    const setCategoryOpen = (id, next) => {
        const ids = new Set(openCategories)
        if (next) ids.add(id)
        else ids.delete(id)
        setOpenIds(ids)
    }

    const toggleOnMenu = async (dish) => {
        setToggling(dish.id)
        setError('')
        try {
            await menu.updateDish(dish.id, { hidden: !dish.hidden })
        } catch (err) {
            setError(`${dish.name}: ${err.message}`)
        } finally {
            setToggling(null)
        }
    }

    // Save the new order after a drag; on failure the list is already back
    // in its old order (useMenu), so only say why
    const reorder = async (categoryId, dishIds) => {
        setError('')
        try {
            await menu.reorderDishes(categoryId, dishIds)
        } catch (err) {
            setError(`Couldn't save the new order: ${err.message}`)
        }
    }

    // Save a dish, then open its category so the result is in view
    const saveDish = async (data) => {
        if (editing.item) await menu.updateDish(editing.item.id, data)
        else await menu.createDish(data)
        setCategoryOpen(data.categoryId, true)
    }

    if (menu.error && !categories) {
        return (
            <div className="taim__notice surface d-flex flex-column gap-1 align-items-start" role="alert">
                <p>Couldn't load the menu: {menu.error}</p>
                <Button variant="secondary" onClick={menu.reload}>Try again</Button>
            </div>
        )
    }
    if (!categories) return <p role="status">Loading the menu…</p>

    const dishCount = categories.reduce((sum, c) => sum + c.items.length, 0)
    const soldOut = categories.reduce((sum, c) => sum + c.items.filter((d) => d.hidden).length, 0)

    return (
        <div className="menu-editor d-flex flex-column gap-2">
            <div className="d-flex flex-wrap align-items-center justify-between gap-1">
                <div className="d-flex flex-column">
                    <h2 className="taim__heading">Menu</h2>
                    <span className="form__hint">
                        {dishCount} dishes in {categories.length} categories{soldOut > 0 && ` · ${soldOut} sold out`}
                    </span>
                </div>
                <div className="d-flex flex-wrap gap-0-5">
                    <Button variant="secondary" icon="IconPlus" onClick={() => setEditing({ kind: 'category' })}>
                        Category
                    </Button>
                    <Button icon="IconPlus" onClick={() => setEditing({ kind: 'dish' })} disabled={categories.length === 0}>
                        Dish
                    </Button>
                </div>
            </div>

            {error && <p className="form__error" role="alert">{error}</p>}

            {categories.length === 0 ? (
                <p className="surface">The menu is empty. Add a category first, then its dishes.</p>
            ) : (
                <Accordion className="menu-editor__categories surface">
                    {categories.map((category) => (
                        <Accordion.Item
                            key={category.id}
                            open={openCategories.has(category.id)}
                            onToggle={(next) => setCategoryOpen(category.id, next)}
                            title={<CategoryTitle category={category} />}
                            actions={
                                <>
                                    <Button size="sm" variant="ghost" onClick={() => setEditing({ kind: 'category', item: category })}>
                                        Rename
                                    </Button>
                                    <Button size="sm" variant="ghost" icon="IconPlus" onClick={() => setEditing({ kind: 'dish', categoryId: category.id })}>
                                        Dish
                                    </Button>
                                </>
                            }
                        >
                            <div className="d-flex flex-column gap-0-5">
                                {category.items.length === 0 ? (
                                    <p className="form__hint menu-editor__empty">No dishes yet.</p>
                                ) : (
                                    <DishList
                                        dishes={category.items}
                                        onReorder={(dishIds) => reorder(category.id, dishIds)}
                                        onToggle={toggleOnMenu}
                                        onEdit={(dish) => setEditing({ kind: 'dish', item: dish })}
                                        toggling={toggling}
                                    />
                                )}
                            </div>
                        </Accordion.Item>
                    ))}
                </Accordion>
            )}

            <Modal
                isOpen={editing?.kind === 'dish'}
                onClose={close}
                title={editing?.item ? `Edit ${editing.item.name}` : 'Add dish'}
            >
                {editing?.kind === 'dish' && (
                    <DishForm
                        dish={editing.item ?? null}
                        categories={categories}
                        categoryId={editing.categoryId}
                        onSave={saveDish}
                        onDone={close}
                    />
                )}
            </Modal>

            <Modal
                isOpen={editing?.kind === 'category'}
                onClose={close}
                title={editing?.item ? 'Rename category' : 'Add category'}
                size="sm"
            >
                {editing?.kind === 'category' && (
                    <CategoryForm
                        category={editing.item ?? null}
                        onSave={(name) => (editing.item ? menu.renameCategory(editing.item.id, name) : menu.createCategory(name))}
                        onDelete={editing.item ? () => menu.deleteCategory(editing.item.id) : undefined}
                        onDone={close}
                    />
                )}
            </Modal>
        </div>
    )
}

/** Category header: "Starters" + "3 dishes · 1 sold out" */
const CategoryTitle = ({ category }) => {
    const soldOut = category.items.filter((d) => d.hidden).length
    const count = category.items.length
    return (
        <span className="menu-editor__category-title d-flex align-items-center gap-0-5">
            <span className="menu-editor__category-name">{category.name}</span>
            <span className="menu-editor__count">
                {count} {count === 1 ? 'dish' : 'dishes'}{soldOut > 0 && ` · ${soldOut} sold out`}
            </span>
        </span>
    )
}

export default MenuEditor
