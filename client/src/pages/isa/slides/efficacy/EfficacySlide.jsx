import SectionOverview from '../../components/SectionOverview/SectionOverview'

// Efficacy overview (parent tile): headline stat + tiles for its sub-slides.
const EfficacySlide = ({ data, slide, onNavigate }) => {
    const { efficacy } = data

    return (
        <SectionOverview
            section={slide}
            headline={efficacy.primaryEndpoint}
            lead={efficacy.overview}
            onNavigate={onNavigate}
        >
            <div className="d-grid grid-2 gap-2">
                {efficacy.series.map((s) => (
                    <div key={s.label} className={`surface isa-stat${s.highlight ? ' is-primary' : ''}`}>
                        <span className="isa-stat__value">{s.value}%</span>
                        <span className="isa-stat__label">{s.label}</span>
                    </div>
                ))}
            </div>
        </SectionOverview>
    )
}

export default EfficacySlide
