/**
 * Centered hero over a dark image/gradient.
 * @param {{ id?: string, eyebrow?: string, title: string, subtitle?: string,
 *          primaryCta?: {label,href}, secondaryCta?: {label,href},
 *          trust?: string, bgImage?: string }} props
 */
const Hero = ({ id, eyebrow, title, subtitle, primaryCta, secondaryCta, trust, bgImage }) => (
    <section
        id={id}
        className="lp-hero"
        style={bgImage ? { '--lp-hero-image': `url(${bgImage})` } : undefined}
    >
        <div className="lp-hero__bg" />
        <div className="lp-hero__inner">
            {eyebrow && <span className="lp-eyebrow lp-hero__eyebrow">{eyebrow}</span>}
            <h1 className="lp-hero__title">{title}</h1>
            {subtitle && <p className="lp-hero__subtitle">{subtitle}</p>}

            <div className="d-flex flex-wrap justify-center gap-1">
                {primaryCta && (
                    <a className="btn btn--primary btn--lg" href={primaryCta.href}>
                        {primaryCta.label}
                    </a>
                )}
                {secondaryCta && (
                    <a className="lp-ghost-light" href={secondaryCta.href}>
                        {secondaryCta.label}
                    </a>
                )}
            </div>

            {trust && <p className="lp-hero__trust">{trust}</p>}
        </div>
    </section>
)

export default Hero
