import { useEffect, useState } from 'react'

/**
 * Returns the id of the section the viewport is currently in.
 * A section counts as "in view" while it crosses a line `offset` (0–1) down
 * the viewport. Returns null between tracked sections. At the very bottom of
 * the page the last id wins, so a short final section can still activate.
 * @param {string[]} ids section ids, in page order
 * @param {number} offset fraction of viewport height used as the reading line
 */
export const useScrollSpy = (ids, offset = 0.35) => {
    const [activeId, setActiveId] = useState(null)
    const key = ids.join('|')

    useEffect(() => {
        const sectionIds = key ? key.split('|') : []
        if (sectionIds.length === 0) return

        let frame = null

        const update = () => {
            frame = null
            const line = window.innerHeight * offset
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2

            let current = null
            if (atBottom) {
                current = sectionIds[sectionIds.length - 1]
            } else {
                for (const id of sectionIds) {
                    const rect = document.getElementById(id)?.getBoundingClientRect()
                    if (rect && rect.top <= line && rect.bottom > line) current = id
                }
            }
            setActiveId(current)
        }

        // Throttle to one check per frame
        const onScroll = () => {
            if (frame === null) frame = requestAnimationFrame(update)
        }

        update()
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onScroll)
        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', onScroll)
            if (frame !== null) cancelAnimationFrame(frame)
        }
    }, [key, offset])

    return activeId
}
