const SafetySlide = ({ data }) => (
    <div className="isa-canvas d-flex flex-column gap-2">
        <div className="d-flex flex-column gap-1">
            <span className="isa-eyebrow">Safety</span>
            <h2 className="isa-h2">Selected safety information</h2>
        </div>

        <div className="surface d-flex flex-column gap-1">
            <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Most common adverse reactions</h3>
            <ul
                className="d-flex flex-column gap-0-5"
                style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text)', lineHeight: 1.6 }}
            >
                {data.safety.common.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>

        <p className="isa-lead">{data.safety.warning}</p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>
            See the Important Safety Information in the top bar for more.
        </p>
    </div>
)

export default SafetySlide
