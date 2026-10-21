import { useScrollSpy } from '@/pages/landing-pages/_shared/hooks/useScrollSpy'

const telHref = (phone) => `tel:${phone.replace(/[^+\d]/g, '')}`

/**
 * Sticky landing header: brand, anchor nav, phone, and a primary CTA.
 * @param {{ brand: string, nav?: {label:string, href:string}[],
 *          phone?: string, cta?: {label:string, href:string} }} props
 */
const LandingHeader = ({ brand, nav = [], phone, cta }) => {
    // Only in-page anchors (#id) can be tracked
    const sectionIds = nav.filter((item) => item.href.startsWith('#')).map((item) => item.href.slice(1))
    const activeId = useScrollSpy(sectionIds)

    return (
        <header className="lp-header">
            <div className="lp-container d-flex align-items-center justify-between py-1">
                <a className="lp-header__logo" href="#top">{brand}</a>

                <nav className="lp-header__nav">
                    {nav.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className={item.href === `#${activeId}` ? 'is-active' : undefined}
                            aria-current={item.href === `#${activeId}` ? 'location' : undefined}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="d-flex align-items-center gap-1">
                    {phone && (
                        <a className="lp-phone" href={telHref(phone)}>
                            <span aria-hidden="true">☎</span> {phone}
                        </a>
                    )}
                    {cta && (
                        <a className="btn btn--primary btn--md" href={cta.href}>
                            {cta.label}
                        </a>
                    )}
                </div>
            </div>
        </header>
    )
}

export default LandingHeader
