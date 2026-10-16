import Accordion from '@/components/ui/accordion/Accordion'
import Button from '@/components/ui/button/Button'

// Closing slide: each key message stays visible as an accordion header;
// expanding it shows the supporting detail and a jump to its evidence slide.
const SummarySlide = ({ data, slide, onNavigate, getSlide }) => (
    <div className="isa-canvas d-flex flex-column gap-2">
        <div className="d-flex flex-column gap-1">
            <span className="isa-eyebrow">{slide.number} · Summary</span>
            <h2 className="isa-h2">{data.summary.headline}</h2>
        </div>

        <ul className="isa-summary isa-reset-list d-flex flex-column gap-1">
            {data.summary.points.map((point) => {
                const target = getSlide(point.slideId)
                return (
                    <li key={point.headline} className="surface px-1 py-0-5">
                        <Accordion>
                            <Accordion.Item
                                title={
                                    <span className="d-flex align-items-center gap-1">
                                        <span className="isa-step__num isa-summary__check" aria-hidden="true">✓</span>
                                        {point.headline}
                                    </span>
                                }
                            >
                                <div className="d-flex flex-column gap-1 isa-summary__detail">
                                    <p className="isa-body lh-1-6">{point.detail}</p>
                                    {target && (
                                        <div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                icon="IconChevronRight"
                                                iconPosition="right"
                                                onClick={() => onNavigate(target.id)}
                                            >
                                                Go to {target.number} {target.title}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Accordion.Item>
                        </Accordion>
                    </li>
                )
            })}
        </ul>

        <p className="isa-lead">{data.summary.closing}</p>
    </div>
)

export default SummarySlide
