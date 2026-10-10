import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useTodos } from '@/pages/todos/context/TodoContext'
import Button from '@/components/ui/button/Button'
import styles from './New.module.scss'

const New = () => {
    const { addTodo } = useTodos()
    const navigate = useNavigate()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')

    const formRef = useRef(null)

    // Subtle fade/rise on mount (skipped for reduced motion) — matches the
    // Todo edit card.
    useLayoutEffect(() => {
        if (!formRef.current) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        gsap.fromTo(
            formRef.current,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
        )
    }, [])

    /**
     * Validate and add a new todo, then redirect to the recent list.
     * @param {React.FormEvent} e
     */
    const handleSubmit = (e) => {
        e.preventDefault()

        if (!title.trim()) {
            setError('Title is required')
            return
        }

        addTodo({ title: title.trim(), description: description.trim() })

        setTitle('')
        setDescription('')
        setError('')

        navigate('/todos')
    }

    return (
        <div className="row">
            <div className="col-12">
                <div className={`mx-auto ${styles.new}`}>
                    <h1 className={styles.new__heading}>New Todo</h1>
                    <form className={styles.new__form} onSubmit={handleSubmit} ref={formRef}>
                        <div className={styles.new__field}>
                            <label className={styles.new__label} htmlFor="title">
                                Title
                            </label>
                            <input
                                id="title"
                                className={`${styles.new__input} ${styles['new__input--title']}`}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What needs to be done?"
                            />
                        </div>

                        <div className={styles.new__field}>
                            <label className={styles.new__label} htmlFor="description">
                                Description
                            </label>
                            <textarea
                                id="description"
                                className={styles.new__textarea}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add more detail (optional)"
                                rows={4}
                            />
                        </div>

                        {error && (
                            <p className={styles.new__error} role="alert">
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            icon="IconPlus"
                            iconPosition="left"
                            className={styles.new__submit}
                        >
                            Add Todo
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default New