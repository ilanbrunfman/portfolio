import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './DeckNav.scss'

/**
 * Two-tier deck navigation:
 *  - main: the top-level deck nodes (sections / parent tiles)
 *  - secondary (rendered above main): the active section's sub-slides,
 *    hidden when it has none. IsaApp passes the overview first, then children.
 */
const DeckNav = ({ mainNodes, activeMainId, secondaryNodes = [], activeId, onSelect }) => {
    const indicatorRef = useRef(null)
    const itemRefs = useRef({})
    const isFirst = useRef(true)

    // Slide the accent indicator to the active main item.
    useLayoutEffect(() => {
        const item = itemRefs.current[activeMainId]
        const indicator = indicatorRef.current
        if (!item || !indicator) return

        const { offsetLeft, offsetWidth } = item
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        if (isFirst.current || reduce) {
            gsap.set(indicator, { x: offsetLeft, width: offsetWidth })
            isFirst.current = false
        } else {
            gsap.to(indicator, { x: offsetLeft, width: offsetWidth, duration: 0.35, ease: 'power3.out' })
        }
    }, [activeMainId])

    return (
        <nav className="isa-nav2" aria-label="Slide navigation">
            {/* Sub-slides of the active section sit above the main row. */}
            {secondaryNodes.length > 0 && (
                <div className="isa-nav2__secondary">
                    {secondaryNodes.map((node) => (
                        <button
                            key={node.id}
                            type="button"
                            className={`isa-nav2__subitem${node.id === activeId ? ' is-active' : ''}`}
                            aria-current={node.id === activeId ? 'true' : undefined}
                            onClick={() => onSelect(node.id)}
                        >
                            {node.title}
                        </button>
                    ))}
                </div>
            )}

            <div className="isa-nav2__main">
                <span className="isa-nav2__indicator" ref={indicatorRef} aria-hidden="true" />
                {mainNodes.map((node) => (
                    <button
                        key={node.id}
                        type="button"
                        ref={(el) => (itemRefs.current[node.id] = el)}
                        className={`isa-nav2__item${node.id === activeMainId ? ' is-active' : ''}`}
                        aria-current={node.id === activeMainId ? 'true' : undefined}
                        onClick={() => onSelect(node.id)}
                    >
                        {node.title}
                    </button>
                ))}
            </div>
        </nav>
    )
}

export default DeckNav
