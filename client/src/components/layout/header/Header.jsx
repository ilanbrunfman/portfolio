import Logo from './Logo'
import SettingsMenu from './settings-menu/SettingsMenu'
import './Header.scss'

const Header = () => {
    return (
        <header className='navbar'>
            <div className="navbar-container">
                <div className="navbar-column">
                    <Logo />
                </div>
                <div className="navbar-column">
                    <SettingsMenu />
                </div>
            </div>
        </header>
    )
}

export default Header