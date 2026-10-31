import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/pages/taim/api/client'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { ROLE_LABELS } from '@/pages/taim/data/screens'
import Modal from '@/components/ui/modal/Modal'
import PinPad from '@/pages/taim/components/pin-pad/PinPad'
import './WhoAreYou.scss'

const initials = (name) => name.slice(0, 2).toUpperCase()

/**
 * "Who are you?" – tap your name, type your 4-digit PIN (step 8.1). The
 * server starts a session (a cookie) and checks that person's role on
 * every request. The demo people's PINs are shown, so visitors can try
 * every role.
 */
const WhoAreYou = () => {
    const { pick } = useStaff()
    const navigate = useNavigate()
    const [staff, setStaff] = useState(null)
    const [error, setError] = useState('')
    const [person, setPerson] = useState(null) // whose PIN pad is open

    useEffect(() => {
        let cancelled = false
        api('/staff')
            .then((list) => { if (!cancelled) setStaff(list) })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [])

    // The PIN pad shows why a PIN was refused (it throws)
    const handlePin = async (pin) => {
        await pick(person.id, pin)
        // StaffProvider now has the session → the app shows instead of this
        // screen. Start on the person's own first screen, not wherever the
        // previous person was.
        navigate('/taim', { replace: true })
    }

    return (
        <section className="who surface d-flex flex-column gap-1" aria-labelledby="who-title">
            <div className="d-flex flex-column gap-0-5">
                <span className="taim__eyebrow">Ta'im</span>
                <h1 id="who-title" className="taim__heading">Who are you?</h1>
                <p className="form__hint">Tap your name and type your PIN. Each role sees different screens.</p>
            </div>

            {error && <p className="form__error" role="alert">{error}</p>}
            {!staff && !error && <p role="status">Loading…</p>}

            {staff && (
                <ul className="who__list">
                    {staff.map((person) => (
                        <li key={person.id}>
                            <button
                                type="button"
                                className="who__person d-flex flex-column align-items-center gap-0-5"
                                onClick={() => setPerson(person)}
                                aria-label={`${person.name}, ${ROLE_LABELS[person.role]}${person.demoPin ? `, demo PIN ${person.demoPin}` : ''}`}
                            >
                                <span className="who__avatar" aria-hidden="true">{initials(person.name)}</span>
                                <span className="who__name">{person.name}</span>
                                <span className="who__role">{ROLE_LABELS[person.role]}</span>
                                {person.demoPin && <span className="who__pin" aria-hidden="true">PIN {person.demoPin}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <Modal isOpen={Boolean(person)} onClose={() => setPerson(null)} title={person ? `Hi, ${person.name}` : ''} size="sm">
                {person && <PinPad name={person.name} demoPin={person.demoPin} onSubmit={handlePin} onCancel={() => setPerson(null)} />}
            </Modal>
        </section>
    )
}

export default WhoAreYou
