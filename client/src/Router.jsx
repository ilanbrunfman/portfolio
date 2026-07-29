import { createBrowserRouter } from 'react-router-dom'

import MainLayout from './components/layout/main/MainLayout'
import HomePage from './pages/home/HomePage'
import AboutPage from './pages/about/AboutPage'
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
        path: '*',
        element: <PageNotFoundPage />,
    },
])

export default router