const BAR_MAX_PX = 190

const PrimaryEndpointSlide = ({ data, slide }) => {
    const { efficacy } = data
    const endpoint = efficacy.endpoints.find((e) => e.id === efficacy.defaultEndpoint)
    const summary = efficacy.arms.map((arm) => `${arm.label} ${endpoint.values[arm.id]} percent`).join(', ')

    return (
        <div className="isa-canvas d-flex flex-column gap-2">
            <div className="d-flex flex-column gap-1">
                <span className="isa-eyebrow">{slide.number} · Efficacy</span>
                <h2 className="isa-h2">{endpoint.title}</h2>
                <span className="isa-badge">Data updated {efficacy.lastUpdated}</span>
            </div>

            <div className="surface">
                <div
                    className="isa-chart"
                    role="img"
                    aria-label={`${endpoint.title}: ${summary}.`}
                >
                    {efficacy.arms.map((arm) => (
                        <div key={arm.id} className="isa-chart__col">
                            <span className="isa-chart__value">{endpoint.values[arm.id]}%</span>
                            <div
                                className={`isa-chart__bar${arm.highlight ? ' is-primary' : ''}`}
                                style={{ height: `${(endpoint.values[arm.id] / 100) * BAR_MAX_PX}px` }}
                            />
                            <span className="isa-chart__label">{arm.label}</span>
                        </div>
                    ))}
                </div>
                <p className="isa-footnote">{efficacy.footnote}</p>
            </div>
        </div>
    )
}

export default PrimaryEndpointSlide
