import { useNow } from '@/pages/taim/hooks/useNow'
import './LiveTimer.scss'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/** One digit as a column of 0–9 that slides to show the right one (it rolls when it changes) */
const RollingDigit = ({ value }) => (
    <span className="live-timer__digit" aria-hidden="true">
        <span className="live-timer__strip" style={{ transform: `translateY(-${Number(value) * 10}%)` }}>
            {DIGITS.map((d) => <span key={d}>{d}</span>)}
        </span>
    </span>
)

/** 8077 s → "2 hours 14 minutes" (what a screen reader hears) */
const spoken = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return [h && `${h} ${h === 1 ? 'hour' : 'hours'}`, `${m} ${m === 1 ? 'minute' : 'minutes'}`].filter(Boolean).join(' ')
}

/**
 * A running timer, HH:MM:SS since `since`, ticking every second; each digit
 * rolls up when it changes, like an odometer (step 8.2: how long you've
 * been on the clock, or on a break). With "reduce motion" the digits just
 * change.
 *
 * @param {object} props
 * @param {string|Date} props.since          When it started.
 * @param {'lg'|'sm'} [props.size]
 * @param {string} [props.label]             What it counts, for screen readers ("On the clock").
 */
const LiveTimer = ({ since, size = 'lg', label = 'Time' }) => {
    const now = useNow(1000)
    const seconds = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000))
    const parts = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((n) => String(n).padStart(2, '0'))

    return (
        <span className={`live-timer is-${size}`} role="timer" aria-label={`${label}: ${spoken(seconds)}`}>
            {parts.map((part, i) => (
                <span key={i} className="live-timer__part">
                    {i > 0 && <span className="live-timer__colon" aria-hidden="true">:</span>}
                    {[...part].map((digit, j) => <RollingDigit key={j} value={digit} />)}
                </span>
            ))}
        </span>
    )
}

export default LiveTimer
