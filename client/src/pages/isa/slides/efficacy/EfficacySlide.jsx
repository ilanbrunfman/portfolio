import SectionOverview from '../../components/SectionOverview/SectionOverview'

// Efficacy overview (parent tile): headline stat + tiles for its sub-slides.
const EfficacySlide = ({ data, slide, onNavigate }) => {
    const { efficacy } = data
    const headline = efficacy.endpoints.find((e) => e.id === efficacy.defaultEndpoint)

    return (
        <SectionOverview
            section={slide}
            headline={headline.title}
            lead={efficacy.overview}
            onNavigate={onNavigate}
        >
            <div className="d-grid grid-1 grid-sm-3 gap-2">
                {efficacy.arms.map((arm) => (
                    <div key={arm.id} className={`surface isa-stat d-flex flex-column gap-0-5${arm.highlight ? ' is-primary' : ''}`}>
                        <span className="isa-stat__value">{headline.values[arm.id]}%</span>
                        <span className="isa-stat__label">{arm.label}</span>
                    </div>
                ))}
            </div>
        </SectionOverview>
    )
}

export default EfficacySlide
