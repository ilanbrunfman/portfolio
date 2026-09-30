import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTodos } from '@/pages/todos/context/TodoContext'

import Icon from '@/components/ui/icon/Icon'
import styles from './Todos.module.scss'

const Todos = () => {
    const { todos } = useTodos()
    const { pathname } = useLocation()
    const getLinkClass = ({ isActive }) =>
        isActive ? `${styles.todos__link} ${styles['todos__link--active']}` : styles.todos__link

    return (
        <div className={styles.todos}>
            <nav className={styles.todos__nav}>
                <NavLink to="/" end className={getLinkClass}>
                    <Icon name="IconHome" size={18} />
                    {/* <span>New</span> */}
                </NavLink>
                { todos.length > 0 && (
                    <NavLink to="/todos" end className={getLinkClass}>
                        <Icon name="IconListBullets" size={18} />
                        {/* <span>Recent</span> */}
                    </NavLink>
                ) }
                { pathname !== '/todos/new' && (
                    <NavLink to="/todos/new" end className={getLinkClass}>
                        <Icon name="IconPlus" size={18} />
                        {/* <span>New</span> */}
                    </NavLink>
                ) }
            </nav>
            <div className={styles.todos__content}>
                <Outlet />
            </div>
        </div>
    )
}

export default Todos