import { Outlet, useLocation } from 'react-router-dom'
import { useTodos } from '@/pages/todos/context/TodoContext'
import SideNavLayout from '@/components/layout/side-nav/SideNavLayout'
import styles from './Todos.module.scss'

/**
 * Todos layout: the shared icon navigation (sidebar on tablet/desktop,
 * bottom bar on phones) + the current page, centered.
 */
const Todos = () => {
    const { todos } = useTodos()
    const { pathname } = useLocation()

    const links = [
        { to: '/', icon: 'IconHome', label: 'Portfolio home', shortLabel: 'Home', end: true },
        // The list only makes sense once there's something in it
        ...(todos.length > 0 ? [{ to: '/todos', icon: 'IconListBullets', label: 'Recent todos', shortLabel: 'Recent', end: true }] : []),
        // No "new" link while already on the new-todo page
        ...(pathname !== '/todos/new' ? [{ to: '/todos/new', icon: 'IconPlus', label: 'New todo', shortLabel: 'New', end: true }] : []),
    ]

    return (
        <SideNavLayout label="Todos" links={links}>
            <div className={styles.todos__content}>
                <Outlet />
            </div>
        </SideNavLayout>
    )
}

export default Todos
