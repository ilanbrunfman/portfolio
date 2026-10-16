const WarningsSlide = ({ data, slide }) => (
    <div className="isa-canvas d-flex flex-column gap-2">
        <div className="d-flex flex-column gap-1">
            <span className="isa-eyebrow">{slide.number} · Safety</span>
            <h2 className="isa-h2">Warnings &amp; precautions</h2>
            <p className="isa-lead">{data.safety.warning}</p>
        </div>

        <div className="d-grid grid-1 grid-md-3 gap-2">
            {data.safety.warnings.map((w) => (
                <div key={w.title} className="surface d-flex flex-column gap-0-5">
                    <h3 className="isa-h3">{w.title}</h3>
                    <p className="isa-body lh-1-6">{w.text}</p>
                </div>
            ))}
        </div>

        <p className="isa-footnote">See the Important Safety Information in the top bar for more.</p>
    </div>
)

export default WarningsSlide
