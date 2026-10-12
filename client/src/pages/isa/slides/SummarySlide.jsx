const SummarySlide = ({ data }) => (
    <div className="isa-canvas d-flex flex-column gap-2">
        <div className="d-flex flex-column gap-1">
            <span className="isa-eyebrow">Summary</span>
            <h2 className="isa-h2">{data.summary.headline}</h2>
        </div>

        <ul className="d-flex flex-column gap-1" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {data.summary.points.map((point) => (
                <li key={point} className="surface d-flex align-items-center gap-1">
                    <span className="isa-step__num" style={{ width: 30, height: 30, flexShrink: 0 }}>
                        ✓
                    </span>
                    <span style={{ color: 'var(--text-h)' }}>{point}</span>
                </li>
            ))}
        </ul>

        <p className="isa-lead">{data.summary.closing}</p>
    </div>
)

export default SummarySlide
