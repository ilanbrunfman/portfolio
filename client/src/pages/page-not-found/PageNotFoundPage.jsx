import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import './PageNotFound.scss'

const status = '404'
const message = 'Page not found'

const PageNotFoundPage = () => {
    const errorRef = useRef(null)
    const messageRef = useRef(null)

    useEffect(() => {
        const err = errorRef.current
        const msg = messageRef.current
        gsap.timeline()
            .fromTo(err, { autoAlpha: 0, x: -10, }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power2.out', delay: 0.2 })
            .fromTo(msg, { x: '-120%', }, { x: 0, duration: 0.6, ease: 'power2.out', delay: 0 }, 0.5)
    }, [])

    return (
        <div className="page-not-found">
            <div className="error" ref={errorRef}>
                <span className="status">{status}</span>
                <div className="message-wrapper">
                    <hr className="divider" />
                    <div className="message" ref={messageRef}>
                        <h1>{message}</h1>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PageNotFoundPage