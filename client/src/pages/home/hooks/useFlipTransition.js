import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

// Wraps GSAP Flip so a grid can animate reflows (filtering, searching, etc.)
// without the owning component managing refs/state for it directly.
//
// Call captureFlipState() right before the state update that changes the grid's
// children — taking a snapshot is what arms the animation, which then plays on
// the next commit. There's no dependency array to keep in sync with whatever
// drives the list (raw vs debounced value, filter, …): any commit that follows
// a capture animates, and every other commit is a cheap no-op.
//
// Usage:
//   const { gridRef, captureFlipState } = useFlipTransition()
//   captureFlipState() // right before the list-changing state update
export const useFlipTransition = () => {
    const gridRef = useRef(null)
    const flipStateRef = useRef(null)

    const captureFlipState = () => {
        if (gridRef.current) {
            flipStateRef.current = Flip.getState(gridRef.current.children)
        }
    }

    useLayoutEffect(() => {
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
    })

    return { gridRef, captureFlipState }
}
