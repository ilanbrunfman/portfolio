import { Outlet } from 'react-router-dom';

import Header from '@/components/layout/header/Header'
import Footer from '@/components/layout/footer/Footer'

const MainLayout = () => {
    return (
        <div className="app-layout">
            <Header/>
            <main>
                <Outlet />
            </main>
            <Footer/>
        </div>
    )
}

export default MainLayout;
