import { Link } from 'react-router-dom'
import Icon from '../icon/Icon'
import './Button.scss'

/**
 * Reusable button/link element. Renders a real <button> for in-page
 * actions, or a <Link>/<a> for navigation — same dual-rendering pattern
 * as Card: pass `to` for internal routes, `href` for external links,
 * or neither plus an `onClick` for a plain action button.
 *
 * Variants control visual style via className, not behavior — keeps
 * this component dumb about what each variant "means" in your design
 * system, just which class to attach.
 *
 * Optional icon: pass `icon` (a name from Icon's registry) and choose
 * `iconPosition` ('left' | 'right', default 'left') to place it
 * before or after the button's text/children.
 */
const Button = ({
    children,
    variant = 'primary', // 'primary' | 'secondary' | 'ghost'
    size = 'md', // 'sm' | 'md' | 'lg'
    icon,
    iconPosition = 'left', // 'left' | 'right'
    to,
    href,
    onClick,
    type = 'button',
    disabled = false,
    className = '',
    ...rest
}) => {
    const classes = ['btn', `btn--${variant}`, `btn--${size}`, className].filter(Boolean).join(' ')

    const content = (
        <>
            {icon && iconPosition === 'left' && <Icon name={icon} className="btn__icon btn__icon--left" />}
            {children && <span className="btn__label">{children}</span>}
            {icon && iconPosition === 'right' && <Icon name={icon} className="btn__icon btn__icon--right" />}
        </>
    )

    if (to) {
        return (
            <Link to={to} className={classes} {...rest}>
                {content}
            </Link>
        )
    }

    if (href) {
        return (
            <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...rest}>
                {content}
            </a>
        )
    }

    return (
        <button type={type} className={classes} onClick={onClick} disabled={disabled} {...rest}>
            {content}
        </button>
    )
}

export default Button