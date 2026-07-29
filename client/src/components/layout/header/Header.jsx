import './Header.scss'

const Header = () => {
    return(
        <header className='navbar'>
            <div className="navbar-container">
                <div className="navbar-column">
                    <h3 className='navbar-logo'>Brunfman</h3>
                </div>
                <div className="navbar-column">
                    <h2>Toggle</h2>
                </div>
            </div>
        </header>
    )
}

export default Header;