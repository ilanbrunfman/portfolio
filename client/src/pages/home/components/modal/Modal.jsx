import { useEffect, useRef, useState } from 'react'
import './Modal.scss'

const Modal = ({ project, onClose }) => {
    const [ratio, setRatio] = useState(16 / 9) // neutral placeholder until measured
    const panelRef = useRef(null)

    // Close on Escape, lock scroll, and manage focus while open: move focus
    // into the dialog, trap Tab inside it, and restore focus to whatever was
    // focused before (the tile) on close.
    useEffect(() => {
        const previouslyFocused = document.activeElement

        const getFocusable = () =>
            panelRef.current
                ? Array.from(
                      panelRef.current.querySelectorAll(
                          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                      )
                  )
                : []

        // Focus the first focusable element in the panel (the close button).
        getFocusable()[0]?.focus()

        const handleKey = (e) => {
            if (e.key === 'Escape') {
                onClose()
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
    }, [onClose])

    if (!project) return null

    const handleImageLoad = (event) => {
        const { naturalWidth, naturalHeight } = event.target
        if (naturalWidth && naturalHeight) {
            setRatio(naturalWidth / naturalHeight)
        }
    }

    return (
        <div className="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
            <div className="project-modal__backdrop" onClick={onClose} />

            <div className="project-modal__panel" ref={panelRef}>
                <div className="project-modal__media" style={{ aspectRatio: ratio }}>
                    <img src={project.image} alt={project.title} onLoad={handleImageLoad} />

                    <button
                        className="project-modal__close"
                        onClick={onClose}
                        aria-label="Close project detail"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="project-modal__body">
                    <h2 id="project-modal-title">{project.title}</h2>
                    <p>{project.description}</p>

                    <ul className="project-modal__tags">
                        {project.tags.map((tag) => (
                            <li key={tag}>{tag}</li>
                        ))}
                    </ul>

                    {project.link && project.link !== '#' && (
                        <a
                            className="project-modal__link"
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                        >
                            View live project
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Modal