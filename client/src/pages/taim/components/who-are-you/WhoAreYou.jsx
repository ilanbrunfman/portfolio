import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/pages/taim/api/client'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { ROLE_LABELS } from '@/pages/taim/data/screens'
import './WhoAreYou.scss'

const initials = (name) => name.slice(0, 2).toUpperCase()

/**
 * "Who are you?" – pick a staff member. No password: the server remembers
 * the choice in a cookie and checks that person's role on every request.
 */
const WhoAreYou = () => {
    const { pick } = useStaff()
    const navigate = useNavigate()
    const [staff, setStaff] = useState(null)
    const [error, setError] = useState('')
    const [pickingId, setPickingId] = useState(null)

    useEffect(() => {
        let cancelled = false
        api('/staff')
            .then((list) => { if (!cancelled) setStaff(list) })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [])

    const handlePick = async (id) => {
        setPickingId(id)
        setError('')
        try {
            await pick(id)
            // StaffProvider now has the session → the app shows instead of this
            // screen. Start on the person's own first screen, not wherever the
            // previous person was.
            navigate('/taim', { replace: true })
        } catch (err) {
            setError(err.message)
            setPickingId(null)
        }
    }

    return (
        <section className="who surface d-flex flex-column gap-1" aria-labelledby="who-title">
            <div className="d-flex flex-column gap-0-5">
                <span className="taim__eyebrow">Ta'im</span>
                <h1 id="who-title" className="taim__heading">Who are you?</h1>
                <p className="form__hint">Pick a person to use Ta'im as them. Each role sees different screens.</p>
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
                                onClick={() => handlePick(person.id)}
                                disabled={pickingId !== null}
                                aria-busy={pickingId === person.id}
                            >
                                <span className="who__avatar" aria-hidden="true">{initials(person.name)}</span>
                                <span className="who__name">{person.name}</span>
                                <span className="who__role">{ROLE_LABELS[person.role]}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

export default WhoAreYou
