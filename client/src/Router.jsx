import { createBrowserRouter } from 'react-router-dom'

import MainLayout from './components/layout/main/MainLayout'
import HomePage from './pages/home/HomePage'
import AboutPage from './pages/about/AboutPage'

import TodoLayout from './pages/todos/Todos'
import { TodoProvider } from './pages/todos/context/TodoContext'
import NewTodo from './pages/todos/new/New'
import RecentTodo from './pages/todos/recent/Recent'
import Todo from './pages/todos/todo/Todo'

import PageNotFoundPage from './pages/page-not-found/PageNotFoundPage'

const router = createBrowserRouter([
    {
        // path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: 'about',
                element: <AboutPage />,
            },
        ]
    },
    {
        path: '/todos',
        element: (
            <TodoProvider>
                <TodoLayout />
            </TodoProvider>
        ),
        children: [
            {
                index: true,
                element: <NewTodo />
            },
            {
                path: 'recent',
                element: <RecentTodo />
            },
            {
                path: ':id',
                element: <Todo />
            }
        ]
    },
    {
        path: '*',
        element: <PageNotFoundPage />,
    },
])

export default router