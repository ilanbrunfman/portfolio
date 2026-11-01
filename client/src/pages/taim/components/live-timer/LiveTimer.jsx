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
 * A running timer since `since`; each digit rolls up when it changes, like
 * an odometer. Two kinds:
 *   'clock'   – HH:MM:SS, ticking every second (step 8.2: on the clock, a break)
 *   'minutes' – "28 min", the minutes rolling once a minute (5.5: a kitchen
 *               ticket – calm, it's read at a glance from the stove)
 * With "reduce motion" the digits just change.
 *
 * @param {object} props
 * @param {string|Date} props.since          When it started.
 * @param {'lg'|'sm'|'inherit'} [props.size]  'inherit' takes the surrounding text's size.
 * @param {'clock'|'minutes'} [props.kind]
 * @param {string} [props.label]             What it counts, for screen readers ("On the clock").
 * @param {string} [props.className]
 */
const LiveTimer = ({ since, size = 'lg', kind = 'clock', label = 'Time', className = '' }) => {
    const now = useNow(kind === 'minutes' ? 10_000 : 1000)
    const seconds = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000))

    if (kind === 'minutes') {
        const minutes = String(Math.floor(seconds / 60))
        return (
            <span className={`live-timer is-${size} ${className}`} role="timer" aria-label={`${label}: ${spoken(seconds)}`}>
                {[...minutes].map((digit, i) => <RollingDigit key={`${minutes.length}-${i}`} value={digit} />)}
                <span className="live-timer__unit" aria-hidden="true">min</span>
            </span>
        )
    }
    const parts = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((n) => String(n).padStart(2, '0'))

    return (
        <span className={`live-timer is-${size} ${className}`} role="timer" aria-label={`${label}: ${spoken(seconds)}`}>
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
