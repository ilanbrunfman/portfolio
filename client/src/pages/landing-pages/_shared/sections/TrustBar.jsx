/**
 * Horizontal strip of trust signals (licensed, insured, rating, …).
 * @param {{ items?: string[] }} props
 */
const TrustBar = ({ items = [] }) => (
    <div className="lp-container py-2">
        <div className="surface lp-trust">
            {items.map((item) => (
                <span key={item} className="lp-trust__item">
                    <span aria-hidden="true">✓</span> {item}
                </span>
            ))}
        </div>
    </div>
)

export default TrustBar
