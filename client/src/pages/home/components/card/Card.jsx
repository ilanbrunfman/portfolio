import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './Card.scss'

/**
 * Renders one project as a full-bleed image tile that plays a short
 * looping preview clip on hover. Title and stack appear on hover/focus
 * too — same pattern as before.
 *
 * Preview media is optional per project via `project.preview`:
 *   { type: 'video', src: '/previews/brunfman-properties.mp4' }
 *   { type: 'gif',   src: '/previews/brunfman-properties.gif' }
 * If omitted, the tile just behaves like before — static image only.
 *
 * Video (recommended): a muted, looping <video> that only starts
 * downloading on first hover (preload="none") and pauses + rewinds on
 * mouse-leave, so it's not burning bandwidth for tiles nobody hovers.
 * A few-second muted MP4/WebM screen capture is typically a fraction
 * of the file size of an equivalent GIF.
 *
 * GIF: swapped in as the visible <img> src on hover — GIFs animate on
 * their own once loaded, no JS play/pause control needed or possible.
 *
 * Touch devices have no hover, so the preview never triggers there —
 * tapping goes straight to onOpen (or the route link) same as a plain
 * image tile would.
 *
 * Tile height is still measured from the real poster image's natural
 * size (see the earlier discussion) — the preview media reuses that
 * same box via object-fit: cover, so it doesn't need its own ratio.
 *
 * Navigation vs modal: if `project.route` is set, the tile renders as
 * a <Link> to that route (real URL, back-button support, SEO-crawlable
 * detail page). If `project.route` is omitted, the tile renders as a
 * <button> that calls `onOpen(project)` to open the ProjectModal
 * instead. Hover/preview behavior is identical either way — only the
 * outer wrapping element and click behavior change.
 */
const Card = ({ project, onOpen }) => {
    const [ratio, setRatio] = useState(4 / 3) // neutral placeholder until measured
    const [isHovering, setIsHovering] = useState(false)
    const videoRef = useRef(null)

    const handleImageLoad = (event) => {
        const { naturalWidth, naturalHeight } = event.target
        if (naturalWidth && naturalHeight) {
            setRatio(naturalWidth / naturalHeight)
        }
    }

    const handleMouseEnter = () => {
        setIsHovering(true)
        // TEMPORARY DEBUG LOG — remove once this is confirmed working.
        // Fires on every hover regardless of whether this tile has a
        // preview, so you can see exactly which tile you're on and
        // whether it's even supposed to have video.
        console.log('hover:', project.title, '— has preview:', Boolean(project.preview))

        if (project.preview?.type === 'video' && videoRef.current) {
            // Belt-and-suspenders: browsers check the DOM `muted` *property*
            // for autoplay policy, and React setting it via JSX doesn't
            // always land reliably for <video>. Setting it explicitly here
            // guarantees the browser sees it as muted before play() runs.
            videoRef.current.muted = true
            videoRef.current.currentTime = 0
            videoRef.current.play().catch((error) => {
                // Log instead of swallowing — a rejected play() is almost
                // always either "not actually muted" or "not enough data
                // buffered yet" (large file + preload="none" + quick hover).
                console.warn('Preview video failed to play:', error)
            })
        }
    }

    const handleMouseLeave = () => {
        setIsHovering(false)
        if (project.preview?.type === 'video' && videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
        }
    }

    const tileContent = (
        <>
            <img
                className="project-tile__image"
                src={project.preview?.type === 'gif' && isHovering ? project.preview.src : project.image}
                alt={project.title}
                loading="lazy"
                onLoad={handleImageLoad}
            />

            {project.preview?.type === 'video' && (
                <video
                    ref={videoRef}
                    className="project-tile__video"
                    src={project.preview.src}
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-hidden="true"
                />
            )}

            <div className="project-tile__overlay">
                <p className="project-tile__title">{project.title}</p>
                <p className="project-tile__stack">{project.tags.join(' · ')}</p>
            </div>
        </>
    )

    const sharedProps = {
        className: 'project-tile',
        style: { aspectRatio: ratio },
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
    }

    if (project.route) {
        return (
            <Link to={project.route} {...sharedProps} aria-label={`View ${project.title} project page`}>
                {tileContent}
            </Link>
        )
    }

    console.log(project.title, '→ route:', project.route, '| rendering as:', project.route ? 'LINK' : 'BUTTON')

    return (
        <button
            type="button"
            {...sharedProps}
            onClick={() => onOpen(project)}
            aria-label={`Open ${project.title} details`}
        >
            {tileContent}
        </button>
    )
}

export default Card