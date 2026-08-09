import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

// Wraps GSAP Flip so a grid can animate reflows (filtering, searching, etc.)
// without the owning component managing refs/state for it directly.
//
// Usage:
//   const { gridRef, captureFlipState } = useFlipTransition([visibleProjects])
//   captureFlipState() // call right before the list-changing state update
export const useFlipTransition = (dependencies) => {
    const gridRef = useRef(null)
    const flipStateRef = useRef(null)
    const isFirstRender = useRef(true)

    const captureFlipState = () => {
        if (gridRef.current) {
            flipStateRef.current = Flip.getState(gridRef.current.children)
        }
    }

    useLayoutEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        if (!flipStateRef.current || !gridRef.current) return

        Flip.from(flipStateRef.current, {
            targets: gridRef.current.children,
            duration: 0.5,
            ease: 'power2.inOut',
            stagger: 0.02,
            absolute: true,
            onEnter: (elements) =>
                gsap.fromTo(
                    elements,
                    { opacity: 0, scale: 0.92 },
                    { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03 }
                ),
            onLeave: (elements) =>
                gsap.to(elements, { opacity: 0, scale: 0.92, duration: 0.3 })
        })

        flipStateRef.current = null
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies)

    return { gridRef, captureFlipState }
}