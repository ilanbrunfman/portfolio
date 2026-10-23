import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { SLIDE_COMPONENTS } from '../../slides'
import './SlideDeck.scss'

const SWIPE_THRESHOLD = 50

/**
 * The slide stage: renders the current slide, animates its entrance based on
 * navigation direction (next → in from the right, prev → in from the left),
 * and handles pointer swipe + arrow keys. Direction is derived from the index
 * delta, so it's correct however the slide changed (swipe, keys, nav, URL).
 *
 * Every slide receives `{ data, slide, onNavigate, getSlide }` — `slide.children`
 * lets a parent (overview) slide link to its sub-slides via `onNavigate(id)`;
 * `getSlide(id)` resolves any other slide (number/title) for cross-links.
 */
const SlideDeck = ({ slide, data, index, onNext, onPrev, onNavigate, getSlide }) => {
    const contentRef = useRef(null)
    const prevIndex = useRef(index)
    const pointer = useRef({ x: 0, y: 0, active: false })
    const handlers = useRef({ onNext, onPrev })
    useEffect(() => {
        handlers.current = { onNext, onPrev }
    })

    useLayoutEffect(() => {
        if (!contentRef.current) return
        const dir = index < prevIndex.current ? -1 : 1
        prevIndex.current = index
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        gsap.fromTo(
            contentRef.current,
            { opacity: 0, x: dir >= 0 ? 48 : -48 },
            { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }
        )
    }, [index])

    // Arrow-key navigation (bound once; reads latest handlers via ref).
    useEffect(() => {
        const onKey = (e) => {
            // Already handled by something focused (e.g. Tabs moving between tabs)
            if (e.defaultPrevented) return
            if (e.key === 'ArrowRight') handlers.current.onNext()
            else if (e.key === 'ArrowLeft') handlers.current.onPrev()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const handleDown = (e) => {
        pointer.current = { x: e.clientX, y: e.clientY, active: true }
    }
    const handleUp = (e) => {
        if (!pointer.current.active) return
        pointer.current.active = false
        const dx = e.clientX - pointer.current.x
        const dy = e.clientY - pointer.current.y
        // Ignore vertical-dominant drags (those are content scrolls).
        if (Math.abs(dx) < Math.abs(dy)) return
        if (dx <= -SWIPE_THRESHOLD) onNext()
        else if (dx >= SWIPE_THRESHOLD) onPrev()
    }

    const SlideComponent = SLIDE_COMPONENTS[slide.component]

    return (
        <div
            className="isa-stage"
            onPointerDown={handleDown}
            onPointerUp={handleUp}
            onPointerCancel={() => {
                pointer.current.active = false
            }}
        >
            <div className="isa-slide" ref={contentRef} key={slide.id}>
                {SlideComponent && <SlideComponent data={data} slide={slide} onNavigate={onNavigate} getSlide={getSlide} />}
            </div>
        </div>
    )
}

export default SlideDeck
