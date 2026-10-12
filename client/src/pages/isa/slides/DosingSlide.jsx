const DosingSlide = ({ data }) => (
    <div className="isa-canvas d-flex flex-column gap-2">
        <div className="d-flex flex-column gap-1">
            <span className="isa-eyebrow">Dosing</span>
            <h2 className="isa-h2">{data.dosing.headline}</h2>
        </div>

        <div className="d-grid grid-1 grid-md-2 gap-2">
            {data.dosing.regimen.map((r) => (
                <div key={r.phase} className="surface d-flex flex-column gap-0-5">
                    <span className="isa-eyebrow">{r.phase}</span>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-h)' }}>
                        {r.detail}
                    </p>
                </div>
            ))}
        </div>

        <ul
            className="d-flex flex-column gap-0-5"
            style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text)', lineHeight: 1.6 }}
        >
            {data.dosing.notes.map((note) => (
                <li key={note}>{note}</li>
            ))}
        </ul>
    </div>
)

export default DosingSlide
