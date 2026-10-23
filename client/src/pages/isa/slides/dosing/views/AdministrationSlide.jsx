const AdministrationSlide = ({ data, slide }) => {
    const { dosing } = data

    return (
        <div className="isa-canvas d-flex flex-column gap-2">
            <div className="d-flex flex-column gap-1">
                <span className="isa-eyebrow">{slide.number} · Dosing</span>
                <h2 className="isa-h2">Administration</h2>
                <p className="isa-lead">{dosing.notes.join(' · ')}</p>
            </div>

            <ol className="d-grid grid-1 grid-md-3 gap-2 isa-reset-list">
                {dosing.administration.map((step, i) => (
                    <li key={step.title} className="surface isa-step d-flex flex-column gap-1">
                        <span className="isa-step__num">{i + 1}</span>
                        <h3 className="isa-h3">{step.title}</h3>
                        <p className="isa-body lh-1-6">{step.text}</p>
                    </li>
                ))}
            </ol>
        </div>
    )
}

export default AdministrationSlide
