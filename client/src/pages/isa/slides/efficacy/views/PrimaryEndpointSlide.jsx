import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Tabs from '@/components/ui/tabs/Tabs'

// One tab per endpoint dataset; each renders a bar per study arm. GSAP owns
// the bar heights (% of the plot) and the n% text (React never writes
// either), so switching tabs morphs bars and counts numbers from what's on
// screen to the new values. Each % label lives inside its bar, so it rides
// the bar's top edge for free.
const PrimaryEndpointSlide = ({ data, slide }) => {
    const { efficacy } = data
    const [activeId, setActiveId] = useState(efficacy.defaultEndpoint)
    const endpoint = efficacy.endpoints.find((e) => e.id === activeId)
    const summary = efficacy.arms.map((arm) => `${arm.label} ${endpoint.values[arm.id]} percent`).join(', ')

    const captionRef = useRef(null)
    const barRefs = useRef([])
    const valueRefs = useRef([])
    // Currently displayed value per arm; persists across tabs so counts
    // continue from the on-screen number (and survive an interrupted tween).
    const counters = useRef(efficacy.arms.map(() => ({ value: 0 })))

    useLayoutEffect(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const tl = gsap.timeline({ defaults: { duration: 0.8, ease: 'power3.out' } })

        if (!reduceMotion) {
            tl.fromTo(captionRef.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0)
        }

        efficacy.arms.forEach((arm, i) => {
            const target = endpoint.values[arm.id]
            const counter = counters.current[i]
            const bar = barRefs.current[i]
            const render = () => {
                valueRefs.current[i].textContent = `${Math.round(counter.value)}%`
            }

            if (reduceMotion) {
                counter.value = target
                gsap.set(bar, { height: `${target}%` })
                render()
                return
            }

            render() // paint the starting number before the first tick
            tl.to(bar, { height: `${target}%` }, i * 0.08)
            tl.to(counter, { value: target, onUpdate: render }, i * 0.08)
        })

        // Rapid tab switches: stop mid-flight; the next run tweens from here.
        return () => tl.kill()
    }, [endpoint, efficacy.arms])

    return (
        <div className="isa-canvas d-flex flex-column gap-2">
            <div className="d-flex flex-column gap-1">
                <span className="isa-eyebrow">{slide.number} · Efficacy</span>
                <h2 className="isa-h2">Primary endpoints</h2>
                <span className="isa-badge">Data updated {efficacy.lastUpdated}</span>
            </div>

            <div className="surface">
                <Tabs
                    label="Primary endpoints"
                    items={efficacy.endpoints.map((e) => ({ id: e.id, label: e.label }))}
                    value={activeId}
                    onChange={setActiveId}
                >
                    <div className="d-flex flex-column gap-2">
                        <div ref={captionRef} className="d-flex flex-column gap-0-5">
                            <span className="isa-eyebrow">Week 16 · % of patients</span>
                            <h3 className="isa-h3">{endpoint.title}</h3>
                        </div>

                        <div className="isa-chart" role="img" aria-label={`${endpoint.title}: ${summary}.`}>
                            <div className="isa-chart__plot d-flex">
                                {efficacy.arms.map((arm, i) => (
                                    <div key={arm.id} className="isa-chart__col d-flex justify-center">
                                        <div
                                            ref={(el) => (barRefs.current[i] = el)}
                                            className={`isa-chart__bar${arm.highlight ? ' is-primary' : ''}`}
                                        >
                                            <span className="isa-chart__value" ref={(el) => (valueRefs.current[i] = el)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="isa-chart__labels d-flex">
                                {efficacy.arms.map((arm) => (
                                    <span key={arm.id} className={`isa-chart__label${arm.highlight ? ' is-primary' : ''}`}>
                                        {arm.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </Tabs>
                <p className="isa-footnote">{efficacy.footnote}</p>
            </div>
        </div>
    )
}

export default PrimaryEndpointSlide
