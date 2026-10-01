import { useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { useTodos } from '@/pages/todos/context/TodoContext'
import Button from '@/components/ui/button/Button'
import styles from './Recent.module.scss'

gsap.registerPlugin(Flip)

const Recent = () => {
    const { todos, toggleComplete, deleteTodo, reorderTodos } = useTodos()

    const dragIndex = useRef(null)
    const [dragOverId, setDragOverId] = useState(null)

    const itemRefs = useRef(new Map())
    const flipState = useRef(null)

    /**
     * Register/unregister an <li> ref by todo id for Flip to track.
     * @param {string} id
     * @param {HTMLElement | null} el
     */
    const setItemRef = (id, el) => {
        if (el) {
            itemRefs.current.set(id, el)
        } else {
            itemRefs.current.delete(id)
        }
    }

    /**
     * Track which item is being dragged.
     * @param {number} index
     */
    const handleDragStart = (index) => {
        dragIndex.current = index
    }

    /**
     * Highlight the item currently being dragged over.
     * @param {React.DragEvent} e
     * @param {string} id
     */
    const handleDragOver = (e, id) => {
        e.preventDefault()
        setDragOverId(id)
    }

    /**
     * Drop handler - captures current DOM positions (Flip "First" state),
     * reorders the todo list, then lets the layout effect animate the
     * transition once React has re-rendered into the new order.
     * @param {number} dropIndex
     */
    const handleDrop = (dropIndex) => {
        const startIndex = dragIndex.current
        setDragOverId(null)
        dragIndex.current = null

        if (startIndex === null || startIndex === dropIndex) return

        // Capture "before" positions of all currently rendered items.
        flipState.current = Flip.getState(Array.from(itemRefs.current.values()))

        const reordered = [...todos]
        const [moved] = reordered.splice(startIndex, 1)
        reordered.splice(dropIndex, 0, moved)

        reorderTodos(reordered)
    }

    /**
     * Delete handler - captures current DOM positions before removal so the
     * remaining items can animate into the gap left by the deleted todo,
     * using the same Flip pipeline as reordering.
     * @param {string} id
     */
    const handleDelete = (id) => {
        flipState.current = Flip.getState(Array.from(itemRefs.current.values()))
        deleteTodo(id)
    }

    /**
     * Move an item by one position, clamped to the list bounds. Shares the
     * Flip pipeline with drag-reorder so the keyboard path animates too.
     * @param {number} index
     * @param {number} direction -1 to move up, +1 to move down
     */
    const moveItem = (index, direction) => {
        const target = index + direction
        if (target < 0 || target >= todos.length) return

        flipState.current = Flip.getState(Array.from(itemRefs.current.values()))

        const reordered = [...todos]
        const [moved] = reordered.splice(index, 1)
        reordered.splice(target, 0, moved)

        reorderTodos(reordered)
    }

    /**
     * Keyboard reordering from the drag handle: Arrow Up/Down move the item.
     * @param {React.KeyboardEvent} e
     * @param {number} index
     */
    const handleHandleKeyDown = (e, index) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            moveItem(index, -1)
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            moveItem(index, 1)
        }
    }

    // After the list re-renders (reorder OR delete), play the Flip animation
    // from the captured "before" state to the new DOM positions.
    useLayoutEffect(() => {
        if (!flipState.current) return

        Flip.from(flipState.current, {
            duration: 0.4,
            ease: 'power2.out',
            absolute: true,
        })

        flipState.current = null
    }, [todos])

    // No todos to show - send the user to the "new todo" view instead of
    // rendering an empty state here. `replace` avoids leaving this empty
    // /todos view in browser history.
    if (!todos.length) {
        return <Navigate to="/todos/new" replace />
    }

    return (
        <div className="row">
            <div className="col-12">
                <div className={`mx-auto ${styles.recent}`}>

                    <h1 className={`${styles.recent__heading} mb-2`}>Recent Todos</h1>

                    <ul className={styles.recent__list}>
                        {todos.map((todo, index) => (
                            <li
                                key={todo.id}
                                ref={(el) => setItemRef(todo.id, el)}
                                className={[
                                    styles.recent__item,
                                    todo.completed ? styles['recent__item--completed'] : '',
                                    dragOverId === todo.id ? styles['recent__item--dragover'] : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, todo.id)}
                                onDrop={() => handleDrop(index)}
                                onDragEnd={() => setDragOverId(null)}
                            >
                                <button
                                    type="button"
                                    className={styles.recent__handle}
                                    onKeyDown={(e) => handleHandleKeyDown(e, index)}
                                    aria-label={`Reorder ${todo.title}. Use the up and down arrow keys to move it.`}
                                >
                                    <span aria-hidden="true">⠿</span>
                                </button>

                                <input
                                    className={styles.recent__checkbox}
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={() => toggleComplete(todo.id)}
                                />

                                <Link className={styles.recent__title} to={`/todos/${todo.id}`}>
                                    {todo.title}
                                </Link>

                                <Button
                                    variant="ghost"
                                    size="md"
                                    icon="IconTrash"
                                    className={styles.recent__delete}
                                    onClick={() => handleDelete(todo.id)}
                                    aria-label={`Delete ${todo.title}`}
                                />
                            </li>
                        ))}
                    </ul>

                </div>
            </div>
        </div>
    )
}

export default Recent