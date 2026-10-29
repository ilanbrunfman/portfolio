import { NavLink } from 'react-router-dom'
import Icon from '@/components/ui/icon/Icon'
import './SideNavLayout.scss'

/**
 * Page layout with a labelled icon navigation: a fixed sidebar on the left
 * on tablet and desktop (icon + label in a row), a fixed tab bar at the
 * bottom on phones ≤ 768px (icon on top, a short label under it).
 * The content area reserves the space the nav takes, so nothing ever sits
 * underneath it.
 *
 * @param {object} props
 * @param {string} props.label  Accessible name for the <nav> (e.g. "Bank").
 * @param {{ to: string, icon: string, label: string, shortLabel?: string, end?: boolean }[]} props.links
 *        Navigation links (top of the sidebar). `end` = only active on that exact URL.
 *        `shortLabel` = what the phone tab bar shows when `label` is too long (e.g. "Home").
 * @param {{ icon: string, label: string, shortLabel?: string, onClick: () => void }[]} [props.actions]
 *        Buttons at the bottom of the sidebar (e.g. Log out).
 * @param {React.ReactNode} props.children  Page content.
 */
const SideNavLayout = ({ label, links, actions = [], children }) => {
    const linkClass = ({ isActive }) => `side-nav__item${isActive ? ' is-active' : ''}`

    return (
        <div className="side-nav-layout">
            <nav className="side-nav" aria-label={label}>
                {links.map((link) => (
                    <NavLink key={link.to} to={link.to} end={link.end} className={linkClass} aria-label={link.label}>
                        <ItemContent {...link} />
                    </NavLink>
                ))}
                {actions.length > 0 && <span className="side-nav__spacer" aria-hidden="true" />}
                {actions.map((action) => (
                    <button key={action.label} type="button" className="side-nav__item" onClick={action.onClick} aria-label={action.label}>
                        <ItemContent {...action} />
                    </button>
                ))}
            </nav>
            <div className="side-nav-layout__content">{children}</div>
        </div>
    )
}

/**
 * Icon + label. The full label shows in the sidebar, the short one in the
 * phone tab bar. aria-label on the item gives screen readers the full name
 * either way (and it contains the short one, so voice control still works).
 */
const ItemContent = ({ icon, label, shortLabel }) => (
    <>
        <Icon name={icon} size={18} />
        <span className="side-nav__label">{label}</span>
        <span className="side-nav__label side-nav__label--short">{shortLabel ?? label}</span>
    </>
)

export default SideNavLayout
