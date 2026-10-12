/**
 * Shared heading block for a section: eyebrow + title + optional lead.
 * Centered by default; pass center={false} for left-aligned.
 */
const SectionHead = ({ eyebrow, title, lead, center = true }) => (
    <div className={`lp-head${center ? ' lp-head--center' : ''}`}>
        {eyebrow && <span className="lp-eyebrow">{eyebrow}</span>}
        <h2 className="lp-title">{title}</h2>
        {lead && <p className="lp-lead">{lead}</p>}
    </div>
)

export default SectionHead
