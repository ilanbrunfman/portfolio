import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Icon from '@/components/ui/icon/Icon'
import './SectionOverview.scss'

/**
 * Parent-tile overview: header (eyebrow / headline / lead) plus one tile per
 * child slide. Tiles navigate to the child; anything passed as `children`
 * (e.g. a key stat) renders between the header and the tiles.
 *
 * @param {{ section: import('../../utils/deck').DeckSlide, headline: React.ReactNode,
 *          lead?: React.ReactNode, onNavigate: (id: string) => void,
 *          children?: React.ReactNode }} props
 */
const SectionOverview = ({ section, headline, lead, onNavigate, children }) => {
    const gridRef = useRef(null)

    useLayoutEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const tiles = gridRef.current?.children
        if (!tiles?.length) return
        gsap.fromTo(
            tiles,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power2.out', delay: 0.1 }
        )
    }, [])

    return (
        <div className="isa-canvas d-flex flex-column gap-2">
            <div className="d-flex flex-column gap-1">
                <span className="isa-eyebrow">
                    {section.number} · {section.title}
                </span>
                <h2 className="isa-h2">{headline}</h2>
                {lead && <p className="isa-lead">{lead}</p>}
            </div>

            {children}

            <nav aria-label={`${section.title} topics`}>
                <ul className="isa-overview" ref={gridRef}>
                    {section.children.map((child) => (
                        <li key={child.id}>
                            <button
                                type="button"
                                className="isa-overview__tile"
                                onClick={() => onNavigate(child.id)}
                            >
                                <span className="isa-overview__num">{child.number}</span>
                                <span className="isa-overview__title">{child.title}</span>
                                {child.summary && (
                                    <span className="isa-overview__summary">{child.summary}</span>
                                )}
                                <Icon name="IconChevronRight" size={18} className="isa-overview__arrow" />
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    )
}

export default SectionOverview
