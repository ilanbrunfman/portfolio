import { useEffect, useState } from 'react'
import './Modal.scss'

const Modal = ({ project, onClose }) => {
    const [ratio, setRatio] = useState(16 / 9) // neutral placeholder until measured

    // Close on Escape, lock scroll while open
    useEffect(() => {
        const handleKey = (e) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', handleKey)
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', handleKey)
            document.body.style.overflow = ''
        }
    }, [onClose])

    // Guard against a stale ratio from a previously-viewed project bleeding
    // into the next one before the new image's onLoad has fired.
    useEffect(() => {
        setRatio(16 / 9)
    }, [project?.id])

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

            <div className="project-modal__panel">
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