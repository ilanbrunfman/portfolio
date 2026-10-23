const telHref = (phone) => `tel:${phone.replace(/[^+\d]/g, '')}`

/**
 * Multi-column landing footer.
 * @param {{ brand, blurb?, phone?, email?, license?,
 *          columns?: {title, links: {label, href}[]}[] }} props
 */
const LandingFooter = ({ brand, blurb, phone, email, license, columns = [] }) => (
    <footer className="lp-footer">
        <div className="lp-container py-4">
            <div className="d-grid grid-1 grid-sm-2 grid-md-4 gap-2">
                <div className="d-flex flex-column gap-0-5">
                    <div className="lp-footer__title">{brand}</div>
                    {blurb && <p className="lp-card__text">{blurb}</p>}
                    {phone && (
                        <a href={telHref(phone)}><span aria-hidden="true">☎</span> {phone}</a>
                    )}
                    {email && <a href={`mailto:${email}`}>{email}</a>}
                </div>

                {columns.map((col) => (
                    <div key={col.title}>
                        <div className="lp-footer__title">{col.title}</div>
                        <ul className="d-flex flex-column gap-0-5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {col.links.map((link) => (
                                <li key={link.label}><a href={link.href}>{link.label}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {license && <p className="lp-card__text mt-2">{license}</p>}
        </div>
    </footer>
)

export default LandingFooter
