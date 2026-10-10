import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { gsap } from 'gsap'
import { useTodos } from '@/pages/todos/context/TodoContext'
import Button from '@/components/ui/button/Button'
import styles from './Todo.module.scss'

const Todo = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { getTodoById, updateTodo, deleteTodo, toggleComplete } = useTodos()

    const todo = getTodoById(id)

    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')

    const editCardRef = useRef(null)
    const viewCardRef = useRef(null)

    // Subtle fade/rise on whichever card is showing (skipped for reduced motion).
    useLayoutEffect(() => {
        const card = isEditing ? editCardRef.current : viewCardRef.current
        if (!card) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        gsap.fromTo(
            card,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
        )
    }, [isEditing])

    if (!todo) {
        return (
            <div className={styles.todo}>
                <p className={styles.todo__notFound}>Todo not found.</p>
                <Button to="/todos" variant="ghost" size="sm" icon="IconArrowLeft">
                    Back to Recent
                </Button>
            </div>
        )
    }

    /**
     * Save edits to the current todo and exit edit mode.
     */
    const handleSave = () => {
        if (!title.trim()) {
            setError('Title is required')
            return
        }
        updateTodo(todo.id, { title: title.trim(), description: description.trim() })
        setError('')
        setIsEditing(false)
    }

    /**
     * Seed the edit fields from the current todo and enter edit mode.
     * Done on demand (instead of mirroring `todo` in an effect) so edits
     * can't be clobbered by unrelated list updates mid-edit.
     */
    const handleEdit = () => {
        setTitle(todo.title)
        setDescription(todo.description)
        setError('')
        setIsEditing(true)
    }

    /**
     * Exit edit mode without saving, discarding any error.
     */
    const handleCancel = () => {
        setError('')
        setIsEditing(false)
    }

    /**
     * Delete the current todo and navigate back to the list.
     */
    const handleDelete = () => {
        deleteTodo(todo.id)
        navigate('/todos')
    }

    return (
        <div className={`${styles.todo} mx-auto`}>
            <div className="row">
                <div className="col-12">
                    <Button
                        to="/todos"
                        variant="ghost"
                        size="sm"
                        icon="IconArrowLeft"
                        className={styles.todo__back}
                    >
                        Back to Recent
                    </Button>
                </div>
            </div>

            {isEditing ? (
                <div className="surface d-flex flex-column gap-1" ref={editCardRef}>
                    <span className="form__eyebrow">Editing</span>

                    <div className="form__field d-flex flex-column gap-0-5">
                        <label className="form__label" htmlFor="todo-title">
                            Title
                        </label>
                        <input
                            id="todo-title"
                            className="form__input form__input--title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Todo title"
                        />
                    </div>

                    <div className="form__field d-flex flex-column gap-0-5">
                        <label className="form__label" htmlFor="todo-description">
                            Description
                        </label>
                        <textarea
                            id="todo-description"
                            className="form__textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more detail (optional)"
                            rows={5}
                        />
                    </div>

                    {error && (
                        <p className="form__error" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="form__actions">
                        <Button variant="ghost" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            Save changes
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="surface d-flex flex-column gap-1" ref={viewCardRef}>
                    <span
                        className={`${styles.todo__status} d-flex align-items-center gap-0-5 align-self-start`}
                        data-completed={todo.completed}
                    >
                        {todo.completed ? 'Completed' : 'In progress'}
                    </span>

                    <h1
                        className={[
                            styles.todo__title,
                            todo.completed ? styles['todo__title--completed'] : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                    >
                        {todo.title}
                    </h1>

                    {todo.description && (
                        <p className={styles.todo__description}>{todo.description}</p>
                    )}

                    <p className={styles.todo__meta}>
                        Created {new Date(todo.createdAt).toLocaleString()}
                    </p>

                    <div className="d-flex flex-wrap gap-0-5">
                        <Button variant="primary" size="sm" onClick={() => toggleComplete(todo.id)}>
                            {todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleEdit}>
                            Edit
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            icon="IconTrash"
                            className={styles.todo__delete}
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Todo