import SectionOverview from '../../components/SectionOverview/SectionOverview'

// Dosing overview (parent tile): regimen at a glance + tiles for its sub-slides.
const DosingSlide = ({ data, slide, onNavigate }) => (
    <SectionOverview
        section={slide}
        headline={data.dosing.headline}
        lead={data.dosing.overview}
        onNavigate={onNavigate}
    >
        <div className="d-grid grid-1 grid-md-2 gap-2">
            {data.dosing.regimen.map((r) => (
                <div key={r.phase} className="surface d-flex flex-column gap-0-5">
                    <span className="isa-eyebrow">{r.phase}</span>
                    <p className="isa-callout">{r.detail}</p>
                </div>
            ))}
        </div>
    </SectionOverview>
)

export default DosingSlide
