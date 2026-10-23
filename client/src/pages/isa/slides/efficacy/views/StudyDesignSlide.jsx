const StudyDesignSlide = ({ data, slide }) => {
    const { efficacy } = data

    return (
        <div className="isa-canvas d-flex flex-column gap-2">
            <div className="d-flex flex-column gap-1">
                <span className="isa-eyebrow">{slide.number} · Efficacy</span>
                <h2 className="isa-h2">Study design</h2>
                <p className="isa-lead">{efficacy.studyDesign}</p>
            </div>

            <dl className="isa-facts d-grid grid-2 grid-md-4 gap-1">
                {efficacy.studyFacts.map((fact) => (
                    <div key={fact.label} className="surface isa-facts__item">
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    )
}

export default StudyDesignSlide
