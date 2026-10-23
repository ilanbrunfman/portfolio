import { createBrowserRouter, Navigate } from 'react-router-dom'

import MainLayout from './components/layout/main/MainLayout'
import HomePage from './pages/home/HomePage'
import AboutPage from './pages/about/AboutPage'

import TodoLayout from './pages/todos/Todos'
import { TodoProvider } from './pages/todos/context/TodoContext'
import NewTodo from './pages/todos/new/New'
import RecentTodo from './pages/todos/recent/Recent'
import Todo from './pages/todos/todo/Todo'

import RoofingPage from './pages/landing-pages/roofing/RoofingPage'
import IsaApp from './pages/isa/IsaApp'
import BankApp from './pages/bank/BankApp'
import BankOverview from './pages/bank/overview/Overview'
import BankAccountPage from './pages/bank/account/AccountPage'

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
            { index: true, element: <RecentTodo /> },
            { path: 'new', element: <NewTodo /> },
            { path: ':id', element: <Todo /> }
        ]
    },
    {
        path: '/roofing',
        element: <RoofingPage />,
    },
    {
        path: '/isa',
        element: <Navigate to="/isa/cover" replace />,
    },
    {
        path: '/isa/:slideId',
        element: <IsaApp />,
    },
    {
        path: '/bank',
        element: <BankApp />,
        children: [
            { index: true, element: <BankOverview /> },
            { path: 'accounts/:id', element: <BankAccountPage /> },
        ]
    },
    {
        path: '*',
        element: <PageNotFoundPage />,
    },
])

export default router