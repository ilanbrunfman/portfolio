const RegimenSlide = ({ data, slide }) => {
    const { dosing } = data
    const lastWeek = dosing.schedule[dosing.schedule.length - 1]
    // First two doses are initiation (Weeks 0 and 4); the rest are maintenance.
    const INITIATION_DOSES = 2

    return (
        <div className="isa-canvas d-flex flex-column gap-2">
            <div className="d-flex flex-column gap-1">
                <span className="isa-eyebrow">{slide.number} · Dosing</span>
                <h2 className="isa-h2">Regimen</h2>
            </div>

            <div className="d-grid grid-1 grid-md-2 gap-2">
                {dosing.regimen.map((r) => (
                    <div key={r.phase} className="surface d-flex flex-column gap-0-5">
                        <span className="isa-eyebrow">{r.phase}</span>
                        <p className="isa-callout">{r.detail}</p>
                    </div>
                ))}
            </div>

            <div className="surface d-flex flex-column gap-1">
                <h3 className="isa-h3">First year at a glance</h3>
                <ol className="isa-timeline" aria-label="Dose schedule by week">
                    {dosing.schedule.map((week, i) => (
                        <li
                            key={week}
                            className={`isa-timeline__dose${i < INITIATION_DOSES ? ' is-initiation' : ''}`}
                            style={{ left: `${(week / lastWeek) * 100}%` }}
                        >
                            <span className="isa-timeline__dot" />
                            <span className="isa-timeline__label">Wk {week}</span>
                        </li>
                    ))}
                </ol>
                <div className="isa-timeline__key d-flex gap-1">
                    <span className="is-initiation">Initiation</span>
                    <span>Maintenance</span>
                </div>
            </div>
        </div>
    )
}

export default RegimenSlide
