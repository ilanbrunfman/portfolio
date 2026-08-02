import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import './Header.scss'

const Header = () => {
    return (
        <header className='navbar'>
            <div className="navbar-container">
                <div className="navbar-column">
                    <Logo />
                </div>
                <div className="navbar-column">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}

export default Header