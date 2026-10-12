/**
 * Row of headline metrics.
 * @param {{ items?: {value: string, label: string}[] }} props
 */
const Stats = ({ items = [] }) => (
    <section className="lp-section">
        <div className="lp-container">
            <div className="d-grid grid-2 grid-md-4 gap-2">
                {items.map((stat) => (
                    <div key={stat.label} className="lp-stat">
                        <div className="lp-stat__value">{stat.value}</div>
                        <div className="lp-stat__label">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    </section>
)

export default Stats
