import { useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/button/Button'
import Icon from '@/components/ui/icon/Icon'
import './PinPad.scss'

const LENGTH = 4

// Focus the hidden input only with a mouse/keyboard: on a phone it would
// open the phone's keyboard over the number pad
const typingDevice = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * Type a 4-digit PIN (step 8.1): four dots, a number pad for touch screens,
 * and the keyboard works too (digits, Backspace). The 4th digit sends it.
 * A wrong PIN shakes the dots, clears them and shows why ("Wrong PIN: 3
 * tries left"). Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {string} props.name                      Whose PIN ("Avi").
 * @param {string|null} [props.demoPin]            The demo PIN, shown as a hint (portfolio visitors).
 * @param {(pin: string) => Promise} props.onSubmit  Throws with the reason when it's refused.
 * @param {() => void} props.onCancel
 */
const PinPad = ({ name, demoPin = null, onSubmit, onCancel }) => {
    const [pin, setPin] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [shake, setShake] = useState(0) // bumps on a wrong PIN, to replay the shake
    const inputRef = useRef(null)

    const focusInput = () => { if (typingDevice()) inputRef.current?.focus() }
    useEffect(focusInput, [])

    const send = async (full) => {
        setBusy(true)
        try {
            await onSubmit(full)
        } catch (err) {
            setError(err.message)
            setPin('')
            setShake((n) => n + 1)
            setBusy(false)
            focusInput()
        }
    }
    const type = (digit) => {
        if (busy || pin.length >= LENGTH) return
        const next = pin + digit
        focusInput()
        setPin(next)
        setError('')
        if (next.length === LENGTH) send(next)
    }
    const back = () => !busy && setPin((current) => current.slice(0, -1))

    return (
        <div className="pin-pad d-flex flex-column align-items-center gap-1">
            <label htmlFor="pin-input" className="form__label">PIN for {name}</label>
            {/* The real input (keyboards, screen readers, password managers stay away: one-time-code) */}
            <input
                id="pin-input"
                ref={inputRef}
                className="pin-pad__input"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={LENGTH}
                value={pin}
                disabled={busy}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'pin-error' : undefined}
                onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, LENGTH)
                    setPin(digits)
                    setError('')
                    if (digits.length === LENGTH) send(digits)
                }}
            />
            <div key={shake} className={`pin-pad__dots d-flex gap-1 ${shake ? 'is-wrong' : ''}`} aria-hidden="true">
                {Array.from({ length: LENGTH }, (_, i) => (
                    <span key={i} className={`pin-pad__dot ${i < pin.length ? 'is-filled' : ''}`} />
                ))}
            </div>
            {error ? (
                <p id="pin-error" className="form__error" role="alert">{error}</p>
            ) : demoPin ? (
                <p className="form__hint">Demo PIN: <strong>{demoPin}</strong></p>
            ) : (
                <p className="form__hint">{busy ? 'Checking…' : ' '}</p>
            )}
            <div className="pin-pad__keys" role="group" aria-label="Number pad">
                {KEYS.map((key) => (
                    <button key={key} type="button" className="pin-pad__key" onClick={() => type(key)} disabled={busy}>{key}</button>
                ))}
                <span aria-hidden="true" />
                <button type="button" className="pin-pad__key" onClick={() => type('0')} disabled={busy}>0</button>
                <button type="button" className="pin-pad__key is-back" onClick={back} disabled={busy || pin.length === 0} aria-label="Delete the last digit">
                    <Icon name="IconArrowLeft" size={20} />
                </button>
            </div>
            <Button variant="ghost" onClick={onCancel} disabled={busy}>Not me</Button>
        </div>
    )
}

export default PinPad
