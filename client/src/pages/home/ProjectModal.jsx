import { useEffect } from 'react'
import './ProjectModal.scss'

const ProjectModal = ({ project, onClose }) => {
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

    if (!project) return null

    return (
        <div className="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
            <div className="project-modal__backdrop" onClick={onClose} />

            <div className="project-modal__panel">
                <div className="project-modal__tab">
                    <span className="project-modal__dots" aria-hidden="true"><i /><i /><i /></span>
                    <span>{project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.tsx</span>
                    <button className="project-modal__close" onClick={onClose} aria-label="Close project detail">
                        esc
                    </button>
                </div>

                <div className="project-modal__media">
                    <img src={project.image} alt={project.title} />
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
                            open_live_project() →
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProjectModal
