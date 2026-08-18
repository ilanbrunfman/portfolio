import { createContext, useContext, useEffect, useState } from 'react'

const TodoContext = createContext(null)

const STORAGE_KEY = 'todos'

const loadTodos = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch (err) {
        console.error('Failed to load todos from localStorage', err)
        return []
    }
}

export const TodoProvider = ({ children }) => {
    const [todos, setTodos] = useState(loadTodos)

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    }, [todos])

    /**
     * Add a new todo.
     * @param {{ title: string, description?: string }} data
     */
    const addTodo = ({ title, description = '' }) => {
        setTodos((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                title,
                description,
                completed: false,
                order: prev.length,
                createdAt: new Date().toISOString(),
            },
        ])
    }

    /**
     * Update an existing todo by id.
     * @param {string} id
     * @param {object} updates
     */
    const updateTodo = (id, updates) => {
        setTodos((prev) =>
            prev.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo))
        )
    }

    /**
     * Remove a todo by id.
     * @param {string} id
     */
    const deleteTodo = (id) => {
        setTodos((prev) => prev.filter((todo) => todo.id !== id))
    }

    /**
     * Toggle the completed state of a todo.
     * @param {string} id
     */
    const toggleComplete = (id) => {
        setTodos((prev) =>
            prev.map((todo) =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        )
    }

    /**
     * Reorder todos given the full array in its new order.
     * Re-stamps the `order` field to match array index.
     * @param {Array} reordered
     */
    const reorderTodos = (reordered) => {
        setTodos(reordered.map((todo, index) => ({ ...todo, order: index })))
    }

    /**
     * Find a single todo by id.
     * @param {string} id
     */
    const getTodoById = (id) => todos.find((todo) => todo.id === id)

    const value = {
        todos: [...todos].sort((a, b) => a.order - b.order),
        addTodo,
        updateTodo,
        deleteTodo,
        toggleComplete,
        reorderTodos,
        getTodoById,
    }

    return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>
}

export const useTodos = () => {
    const context = useContext(TodoContext)
    if (!context) {
        throw new Error('useTodos must be used within a TodoProvider')
    }
    return context
}