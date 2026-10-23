/**
 * Text + image, side by side on desktop and stacked on mobile.
 * @param {{ id?, eyebrow?, title, body?: string[], image, imageAlt?,
 *          cta?: {label,href}, reverse?: boolean }} props
 */
const MediaSplit = ({ id, eyebrow, title, body = [], image, imageAlt = '', cta, reverse = false }) => (
    <section id={id} className="lp-section">
        <div className="lp-container">
            <div className={`lp-split${reverse ? ' lp-split--reverse' : ''}`}>
                <div className="d-flex flex-column gap-1">
                    {eyebrow && <span className="lp-eyebrow">{eyebrow}</span>}
                    <h2 className="lp-title">{title}</h2>
                    {body.map((paragraph, i) => (
                        <p key={i} className="lp-lead">{paragraph}</p>
                    ))}
                    {cta && (
                        <div className="mt-1">
                            <a className="btn btn--primary btn--md" href={cta.href}>{cta.label}</a>
                        </div>
                    )}
                </div>
                <img className="lp-split__media" src={image} alt={imageAlt} loading="lazy" />
            </div>
        </div>
    </section>
)

export default MediaSplit
