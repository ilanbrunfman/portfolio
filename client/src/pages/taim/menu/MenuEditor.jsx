import { useState } from 'react'
import { useMenu } from '@/pages/taim/hooks/useMenu'
import DishForm from '@/pages/taim/components/dish-form/DishForm'
import CategoryForm from '@/pages/taim/components/category-form/CategoryForm'
import Modal from '@/components/ui/modal/Modal'
import Button from '@/components/ui/button/Button'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import { formatMoney } from '@/pages/taim/utils/money'
import './MenuEditor.scss'

/**
 * /taim/menu – the Manager's and Chef's menu editor: every category with its
 * dishes, "On menu" to mark a dish sold out right from the list, and forms
 * to add or edit dishes and categories. (The route only renders it for roles
 * with the editMenu right; the server refuses changes from anyone else.)
 */
const MenuEditor = () => {
    const menu = useMenu()
    const { categories } = menu
    // What the modal shows: { kind: 'dish' | 'category', item?, categoryId? } or null
    const [editing, setEditing] = useState(null)
    const [toggling, setToggling] = useState(null) // id of the dish being switched on/off
    const [error, setError] = useState('')
    const close = () => setEditing(null)

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
                    <h2 className="taim__heading">Menu editor</h2>
                    <span className="form__hint">
                        {dishCount} dishes in {categories.length} categories{soldOut > 0 && ` · ${soldOut} sold out`}
                    </span>
                </div>
                <div className="d-flex flex-wrap gap-0-5">
                    <Button variant="secondary" icon="IconPlus" onClick={() => setEditing({ kind: 'category' })}>
                        Category
                    </Button>
                    <Button
                        icon="IconPlus"
                        onClick={() => setEditing({ kind: 'dish' })}
                        disabled={categories.length === 0}
                    >
                        Dish
                    </Button>
                </div>
            </div>

            {error && <p className="form__error" role="alert">{error}</p>}
            {categories.length === 0 && (
                <p className="surface">The menu is empty. Add a category first, then its dishes.</p>
            )}

            {categories.map((category) => (
                <section key={category.id} className="menu-editor__category surface d-flex flex-column gap-1" aria-labelledby={`cat-${category.id}`}>
                    <div className="d-flex align-items-center justify-between gap-1">
                        <h3 id={`cat-${category.id}`} className="menu-editor__category-name">{category.name}</h3>
                        <div className="d-flex gap-0-5">
                            <Button size="sm" variant="ghost" onClick={() => setEditing({ kind: 'category', item: category })}>
                                Rename
                            </Button>
                            <Button size="sm" variant="ghost" icon="IconPlus" onClick={() => setEditing({ kind: 'dish', categoryId: category.id })}>
                                Dish
                            </Button>
                        </div>
                    </div>

                    {category.items.length === 0 ? (
                        <p className="form__hint">No dishes yet.</p>
                    ) : (
                        <ul className="menu-editor__dishes">
                            {category.items.map((dish) => (
                                <li key={dish.id} className={`menu-editor__dish d-flex flex-wrap align-items-center gap-1 ${dish.hidden ? 'is-sold-out' : ''}`}>
                                    <div className="menu-editor__dish-text d-flex flex-column">
                                        <span className="menu-editor__dish-name">
                                            {dish.name}
                                            {dish.hidden && <span className="menu-editor__tag">Sold out</span>}
                                        </span>
                                        {dish.description && <span className="form__hint">{dish.description}</span>}
                                    </div>
                                    {/* Price, toggle and Edit wrap together under the name on narrow screens */}
                                    <div className="d-flex align-items-center gap-1">
                                        <span className="menu-editor__price">{formatMoney(dish.price)}</span>
                                        <Checkbox
                                            label="On menu"
                                            checked={!dish.hidden}
                                            onChange={() => toggleOnMenu(dish)}
                                            disabled={toggling === dish.id}
                                        />
                                        <Button size="sm" variant="ghost" onClick={() => setEditing({ kind: 'dish', item: dish })}>
                                            Edit
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            ))}

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
                        onSave={(data) => (editing.item ? menu.updateDish(editing.item.id, data) : menu.createDish(data))}
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

export default MenuEditor
