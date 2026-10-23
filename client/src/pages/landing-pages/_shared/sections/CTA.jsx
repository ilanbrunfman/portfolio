const telHref = (phone) => `tel:${phone.replace(/[^+\d]/g, '')}`

/**
 * Accent CTA band.
 * @param {{ id?, title, text?, cta?: {label,href}, phone?: string }} props
 */
const CTA = ({ id, title, text, cta, phone }) => (
    <section id={id} className="lp-section">
        <div className="lp-container">
            <div className="lp-cta">
                <h2 className="lp-cta__title">{title}</h2>
                {text && <p className="lp-cta__text">{text}</p>}

                <div className="d-flex flex-wrap justify-center gap-1 mt-2">
                    {cta && <a className="lp-btn-light" href={cta.href}>{cta.label}</a>}
                    {phone && (
                        <a className="lp-ghost-light" href={telHref(phone)}>
                            <span aria-hidden="true">☎</span> {phone}
                        </a>
                    )}
                </div>
            </div>
        </div>
    </section>
)

export default CTA
