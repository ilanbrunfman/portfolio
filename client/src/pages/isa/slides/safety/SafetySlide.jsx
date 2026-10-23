import SectionOverview from '../../components/SectionOverview/SectionOverview'

// Safety overview (parent tile): key warning + tiles for its sub-slides.
const SafetySlide = ({ data, slide, onNavigate }) => (
    <SectionOverview
        section={slide}
        headline="Selected safety information"
        lead={data.safety.overview}
        onNavigate={onNavigate}
    >
        <div className="surface isa-note">{data.safety.warning}</div>
    </SectionOverview>
)

export default SafetySlide
