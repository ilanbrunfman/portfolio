import { NavLink } from 'react-router-dom'
import Icon from '@/components/ui/icon/Icon'
import './SideNavLayout.scss'

/**
 * Page layout with an icon navigation: a fixed sidebar on the left on
 * tablet and desktop, a fixed tab bar at the bottom on phones (≤ 768px).
 * Same look as the Todos navigation. The content area reserves the space
 * the nav takes, so nothing ever sits underneath it.
 *
 * @param {object} props
 * @param {string} props.label  Accessible name for the <nav> (e.g. "Bank").
 * @param {{ to: string, icon: string, label: string, end?: boolean }[]} props.links
 *        Navigation links (top of the sidebar). `end` = only active on that exact URL.
 * @param {{ icon: string, label: string, onClick: () => void }[]} [props.actions]
 *        Buttons at the bottom of the sidebar (e.g. Log out).
 * @param {React.ReactNode} props.children  Page content.
 */
const SideNavLayout = ({ label, links, actions = [], children }) => {
    const linkClass = ({ isActive }) => `side-nav__item${isActive ? ' is-active' : ''}`

    return (
        <div className="side-nav-layout">
            <nav className="side-nav" aria-label={label}>
                {links.map((link) => (
                    <NavLink key={link.to} to={link.to} end={link.end} className={linkClass} aria-label={link.label} title={link.label}>
                        <Icon name={link.icon} size={18} />
                    </NavLink>
                ))}
                {actions.length > 0 && <span className="side-nav__spacer" aria-hidden="true" />}
                {actions.map((action) => (
                    <button
                        key={action.label}
                        type="button"
                        className="side-nav__item"
                        onClick={action.onClick}
                        aria-label={action.label}
                        title={action.label}
                    >
                        <Icon name={action.icon} size={18} />
                    </button>
                ))}
            </nav>
            <div className="side-nav-layout__content">{children}</div>
        </div>
    )
}

export default SideNavLayout
