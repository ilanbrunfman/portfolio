import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Tabs from '@/components/ui/tabs/Tabs'

const BAR_MAX_PX = 190

// One tab per endpoint dataset; each renders a bar per study arm. GSAP owns
// the bar heights and the n% text (React never writes either), so switching
// tabs morphs bars and counts numbers from what's on screen to the new values.
const PrimaryEndpointSlide = ({ data, slide }) => {
    const { efficacy } = data
    const [activeId, setActiveId] = useState(efficacy.defaultEndpoint)
    const endpoint = efficacy.endpoints.find((e) => e.id === activeId)
    const summary = efficacy.arms.map((arm) => `${arm.label} ${endpoint.values[arm.id]} percent`).join(', ')

    const barRefs = useRef([])
    const valueRefs = useRef([])
    // Currently displayed value per arm; persists across tabs so counts
    // continue from the on-screen number (and survive an interrupted tween).
    const counters = useRef(efficacy.arms.map(() => ({ value: 0 })))

    useLayoutEffect(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const tl = gsap.timeline({ defaults: { duration: 0.7, ease: 'power3.out' } })

        efficacy.arms.forEach((arm, i) => {
            const target = endpoint.values[arm.id]
            const counter = counters.current[i]
            const bar = barRefs.current[i]
            const render = () => {
                valueRefs.current[i].textContent = `${Math.round(counter.value)}%`
            }
            const height = (target / 100) * BAR_MAX_PX

            if (reduceMotion) {
                counter.value = target
                gsap.set(bar, { height })
                render()
                return
            }

            render() // paint the starting number before the first tick
            tl.to(bar, { height }, i * 0.08)
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
                    <h3 className="isa-h3">{endpoint.title}</h3>
                    <div className="isa-chart" role="img" aria-label={`${endpoint.title}: ${summary}.`}>
                        {efficacy.arms.map((arm, i) => (
                            <div key={arm.id} className="isa-chart__col">
                                <span className="isa-chart__value" ref={(el) => (valueRefs.current[i] = el)} />
                                <div
                                    ref={(el) => (barRefs.current[i] = el)}
                                    className={`isa-chart__bar${arm.highlight ? ' is-primary' : ''}`}
                                />
                                <span className="isa-chart__label">{arm.label}</span>
                            </div>
                        ))}
                    </div>
                </Tabs>
                <p className="isa-footnote">{efficacy.footnote}</p>
            </div>
        </div>
    )
}

export default PrimaryEndpointSlide
