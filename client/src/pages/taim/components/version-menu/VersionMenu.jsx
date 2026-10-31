import { useMenu } from '@/pages/taim/hooks/useMenu'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import './VersionMenu.scss'

/**
 * One menu version's dishes, read only: each category with its dishes in
 * order – name, description, prep time, price, and "Sold out" on the menu
 * in use. Nothing here changes the menu. Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {number} props.versionId
 */
const VersionMenu = ({ versionId }) => {
    const menu = useMenu(versionId)
    const { categories } = menu

    if (menu.error && !categories) {
        return (
            <div className="d-flex flex-column gap-1 align-items-start" role="alert">
                <p className="form__error">Couldn't load this menu: {menu.error}</p>
                <Button size="sm" variant="secondary" onClick={menu.reload}>Try again</Button>
            </div>
        )
    }
    if (!categories) return <p role="status">Loading the menu…</p>
    if (categories.length === 0) return <p className="form__hint">This menu has no dishes.</p>

    return (
        <div className="version-menu d-flex flex-column gap-1">
            {categories.map((category) => (
                <section key={category.id} aria-label={category.name}>
                    <h3 className="version-menu__category">
                        {category.name} <span className="version-menu__count">{category.items.length}</span>
                    </h3>
                    <ul className="version-menu__dishes">
                        {category.items.map((dish) => (
                            <li key={dish.id} className={`version-menu__dish d-flex justify-between align-items-start gap-1 ${dish.hidden ? 'is-sold-out' : ''}`}>
                                <span className="d-flex flex-column">
                                    <span className="version-menu__name">
                                        {dish.name}
                                        {dish.hidden && <span className="version-menu__tag">Sold out</span>}
                                    </span>
                                    {dish.description && <span className="form__hint">{dish.description}</span>}
                                    {dish.prepMinutes && <span className="version-menu__prep">Prep {dish.prepMinutes} min</span>}
                                </span>
                                <span className="version-menu__price">{formatMoney(dish.price)}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    )
}

export default VersionMenu
