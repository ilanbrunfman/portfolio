import { Link, useLocation } from 'react-router-dom'

const Logo = () => {
    const location = useLocation()

    const handleClick = (event) => {
        if (location.pathname === '/') {
            event.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        // Any other route: let <Link> navigate to "/" normally.
    }

    return (
        <Link to="/" className="navbar-logo" onClick={handleClick} aria-label="Brunfman — back to top">
            Brunfman
        </Link>
    )
}

export default Logo
