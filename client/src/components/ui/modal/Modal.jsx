import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Icon from '@/components/ui/icon/Icon'
import './Modal.scss'

const FOCUSABLE =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Reusable dialog. Controlled via `isOpen` / `onClose`.
 *
 * Handles focus-trap, Escape, scroll-lock, backdrop click, and focus restore,
 * plus nested GSAP enter/exit animations (backdrop fade + panel rise/scale).
 * The exit plays before unmount via an internal `render` flag.
 *
 * @param {{ isOpen: boolean, onClose: () => void, title?: React.ReactNode,
 *          size?: 'sm'|'md'|'lg'|'full', children: React.ReactNode }} props
 */
const Modal = ({ isOpen, onClose, title, size = 'md', children }) => {
    const [render, setRender] = useState(isOpen)
    const panelRef = useRef(null)
    const backdropRef = useRef(null)
    const titleId = useId()

    // Mount as soon as we open (so the enter animation has a node to play on).
    useLayoutEffect(() => {
        if (!isOpen) return
        // eslint-disable-next-line react-hooks/set-state-in-effect -- deferred-unmount pattern: mount now, unmount after the exit animation
        setRender(true)
    }, [isOpen])

    // Enter when open; on close, play the exit then unmount (in onComplete).
    useLayoutEffect(() => {
        const panel = panelRef.current
        const backdrop = backdropRef.current
        if (!panel || !backdrop) return
        const reduce = prefersReduced()

        if (isOpen) {
            if (reduce) return
            const tl = gsap.timeline()
            tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power1.out' }, 0)
            tl.fromTo(
                panel,
                { opacity: 0, y: 12, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' },
                0.03
            )
            return () => tl.kill()
        }

        if (!render) return
        const tl = gsap.timeline({ onComplete: () => setRender(false) })
        tl.to(panel, { opacity: 0, y: 10, scale: 0.98, duration: reduce ? 0 : 0.2, ease: 'power2.in' }, 0)
        tl.to(backdrop, { opacity: 0, duration: reduce ? 0 : 0.2, ease: 'power1.in' }, 0)
        return () => tl.kill()
    }, [isOpen, render])

    // Focus-trap, Escape, scroll-lock, focus restore while open.
    useEffect(() => {
        if (!isOpen) return

        const previouslyFocused = document.activeElement
        const getFocusable = () =>
            panelRef.current ? Array.from(panelRef.current.querySelectorAll(FOCUSABLE)) : []

        getFocusable()[0]?.focus()

        const handleKey = (e) => {
            if (e.key === 'Escape') {
                onClose?.()
                return
            }
            if (e.key === 'Tab') {
                const focusable = getFocusable()
                if (focusable.length === 0) return
                const first = focusable[0]
                const last = focusable[focusable.length - 1]
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault()
                    last.focus()
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault()
                    first.focus()
                }
            }
        }

        document.addEventListener('keydown', handleKey)
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', handleKey)
            document.body.style.overflow = ''
            previouslyFocused?.focus?.()
        }
    }, [isOpen, onClose])

    if (!render) return null

    return (
        <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
        >
            <div className="modal__backdrop" ref={backdropRef} onClick={onClose} />

            <div className={`modal__panel modal__panel--${size}`} ref={panelRef}>
                <div className="modal__head">
                    {title && <h2 id={titleId} className="modal__title">{title}</h2>}
                    <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
                        <Icon name="IconX" size={18} />
                    </button>
                </div>

                <div className="modal__body">{children}</div>
            </div>
        </div>
    )
}

export default Modal
