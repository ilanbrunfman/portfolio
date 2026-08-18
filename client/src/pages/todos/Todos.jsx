import { NavLink, Outlet } from 'react-router-dom'
import Icon from '@/components/ui/icon/Icon'
import styles from './Todos.module.scss'

const Todos = () => {
    const getLinkClass = ({ isActive }) =>
        isActive ? `${styles.todos__link} ${styles['todos__link--active']}` : styles.todos__link

    return (
        <div className={styles.todos}>
            <nav className={styles.todos__nav}>
                <NavLink to="/todos" end className={getLinkClass}>
                    <Icon name="IconPlus" size={18} />
                    {/* <span>New</span> */}
                </NavLink>
                <NavLink to="/todos/recent" className={getLinkClass}>
                    <Icon name="IconListBullets" size={18} />
                    {/* <span>Recent</span> */}
                </NavLink>
            </nav>
            <div className={styles.todos__content}>
                <Outlet />
            </div>
        </div>
    )
}

export default Todos