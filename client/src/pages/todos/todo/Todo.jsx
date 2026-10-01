import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
        updateTodo(todo.id, { title: title.trim(), description: description.trim() })
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
        setIsEditing(true)
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
                <div className={styles.todo__editForm}>
                    <input
                        className={styles.todo__input}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea
                        className={styles.todo__textarea}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                    />
                    <div className={styles.todo__actions}>
                        <Button variant="primary" onClick={handleSave}>
                            Save
                        </Button>
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <>
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

                    <div className={styles.todo__actions}>
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
                </>
            )}
        </div>
    )
}

export default Todo