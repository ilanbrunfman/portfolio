import { useState } from 'react'
import Button from '@/components/ui/button/Button'
import Modal from '@/components/ui/modal/Modal'

const BAR_MAX_PX = 190

const EfficacySlide = ({ data }) => {
    const [designOpen, setDesignOpen] = useState(false)
    const { efficacy } = data

    const summary = efficacy.series.map((s) => `${s.label} ${s.value} percent`).join(', ')

    return (
        <div className="isa-canvas d-flex flex-column gap-2">
            <div className="d-flex flex-column gap-1">
                <span className="isa-eyebrow">Efficacy</span>
                <h2 className="isa-h2">{efficacy.primaryEndpoint}</h2>
                <span className="isa-badge">Data updated {efficacy.lastUpdated}</span>
            </div>

            <div className="surface">
                <div
                    className="isa-chart"
                    role="img"
                    aria-label={`${efficacy.primaryEndpoint}: ${summary}.`}
                >
                    {efficacy.series.map((s) => (
                        <div key={s.label} className="isa-chart__col">
                            <span className="isa-chart__value">{s.value}%</span>
                            <div
                                className={`isa-chart__bar${s.highlight ? ' is-primary' : ''}`}
                                style={{ height: `${(s.value / 100) * BAR_MAX_PX}px` }}
                            />
                            <span className="isa-chart__label">{s.label}</span>
                        </div>
                    ))}
                </div>
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: 'var(--text)' }}>
                    {efficacy.footnote}
                </p>
            </div>

            <div>
                <Button variant="secondary" size="sm" onClick={() => setDesignOpen(true)}>
                    Study design
                </Button>
            </div>

            <Modal isOpen={designOpen} onClose={() => setDesignOpen(false)} title="Study design" size="md">
                <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text)' }}>{efficacy.studyDesign}</p>
            </Modal>
        </div>
    )
}

export default EfficacySlide
