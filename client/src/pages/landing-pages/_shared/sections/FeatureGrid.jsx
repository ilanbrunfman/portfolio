import Icon from '@/components/ui/icon/Icon'
import SectionHead from './SectionHead'

/**
 * A heading + responsive grid of cards. Used for Services and Why-Us.
 * @param {{ id?, eyebrow?, title, lead?, columns?: 2|3|4,
 *          items: {icon?, title, text, href?}[] }} props
 */
const GRID_COLS = {
    2: 'grid-1 grid-md-2',
    3: 'grid-1 grid-sm-2 grid-lg-3',
    4: 'grid-2 grid-md-4',
}

const FeatureGrid = ({ id, eyebrow, title, lead, columns = 3, items = [] }) => (
    <section id={id} className="lp-section">
        <div className="lp-container">
            <SectionHead eyebrow={eyebrow} title={title} lead={lead} />

            <div className={`d-grid ${GRID_COLS[columns] || GRID_COLS[3]} gap-2`}>
                {items.map((item) => (
                    <article key={item.title} className="surface lp-card d-flex flex-column gap-1">
                        {item.icon && (
                            <span className="lp-icon">
                                <Icon name={item.icon} size={24} />
                            </span>
                        )}
                        <h3 className="lp-card__title">{item.title}</h3>
                        <p className="lp-card__text">{item.text}</p>
                        {item.href && (
                            <a className="lp-card__link" href={item.href}>Learn more →</a>
                        )}
                    </article>
                ))}
            </div>
        </div>
    </section>
)

export default FeatureGrid
