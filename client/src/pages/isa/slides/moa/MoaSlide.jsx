import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

const MoaSlide = ({ data }) => {
    const gridRef = useRef(null)

    useLayoutEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const steps = gridRef.current?.querySelectorAll('[data-step]')
        if (!steps?.length) return
        gsap.fromTo(
            steps,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.12, ease: 'power2.out' }
        )
    }, [])

    return (
        <div className="isa-canvas d-flex flex-column gap-2">
            <div className="d-flex flex-column gap-1">
                <span className="isa-eyebrow">Mechanism of action</span>
                <h2 className="isa-h2">How {data.name}{data.tm} works</h2>
                <p className="isa-lead">{data.moa.summary}</p>
            </div>

            <div className="d-grid grid-1 grid-md-3 gap-2" ref={gridRef}>
                {data.moa.steps.map((step, i) => (
                    <div key={step.title} data-step className="surface isa-step d-flex flex-column gap-1">
                        <span className="isa-step__num">{i + 1}</span>
                        <h3 style={{ margin: 0, color: 'var(--text-h)' }}>{step.title}</h3>
                        <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.6 }}>{step.text}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MoaSlide
