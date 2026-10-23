import SectionHead from './SectionHead'

/**
 * Grid of review cards.
 * @param {{ id?, eyebrow?, title, lead?, items: {quote, name, meta}[] }} props
 */
const Testimonials = ({ id, eyebrow, title, lead, items = [] }) => (
    <section id={id} className="lp-section">
        <div className="lp-container">
            <SectionHead eyebrow={eyebrow} title={title} lead={lead} />

            <div className="d-grid grid-1 grid-md-3 gap-2">
                {items.map((t) => (
                    <figure key={t.name} className="surface d-flex flex-column gap-1" style={{ margin: 0 }}>
                        <div aria-hidden="true" style={{ color: 'var(--accent)', letterSpacing: '2px' }}>
                            ★★★★★
                        </div>
                        <blockquote className="lp-card__text" style={{ margin: 0 }}>
                            “{t.quote}”
                        </blockquote>
                        <figcaption className="d-flex flex-column">
                            <strong style={{ color: 'var(--text-h)' }}>{t.name}</strong>
                            <span className="lp-card__text">{t.meta}</span>
                        </figcaption>
                    </figure>
                ))}
            </div>
        </div>
    </section>
)

export default Testimonials
