import { useState } from 'react'

const telHref = (phone) => `tel:${phone.replace(/[^+\d]/g, '')}`

/**
 * Quote-request form built on the shared .form / .surface system.
 * No backend — submitting shows a confirmation. Wire up onSubmit later.
 * @param {{ id?, eyebrow?, title, lead?, phone? }} props
 */
const ContactForm = ({ id, eyebrow, title, lead, phone }) => {
    const [sent, setSent] = useState(false)
    const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })

    const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

    const handleSubmit = (e) => {
        e.preventDefault()
        setSent(true)
    }

    return (
        <section id={id} className="lp-section">
            <div className="lp-container">
                <div className="lp-split">
                    <div className="d-flex flex-column gap-1">
                        {eyebrow && <span className="lp-eyebrow">{eyebrow}</span>}
                        <h2 className="lp-title">{title}</h2>
                        {lead && <p className="lp-lead">{lead}</p>}
                        {phone && (
                            <a className="lp-phone" href={telHref(phone)}>
                                <span aria-hidden="true">☎</span> {phone}
                            </a>
                        )}
                    </div>

                    <form className="surface d-flex flex-column gap-1" onSubmit={handleSubmit}>
                        {sent ? (
                            <p className="lp-card__text">Thanks — we’ll be in touch shortly.</p>
                        ) : (
                            <>
                                <div className="form__field d-flex flex-column gap-0-5">
                                    <label className="form__label" htmlFor="lp-name">Name</label>
                                    <input id="lp-name" className="form__input" value={form.name} onChange={update('name')} required />
                                </div>
                                <div className="form__field d-flex flex-column gap-0-5">
                                    <label className="form__label" htmlFor="lp-phone">Phone</label>
                                    <input id="lp-phone" className="form__input" type="tel" value={form.phone} onChange={update('phone')} required />
                                </div>
                                <div className="form__field d-flex flex-column gap-0-5">
                                    <label className="form__label" htmlFor="lp-email">Email</label>
                                    <input id="lp-email" className="form__input" type="email" value={form.email} onChange={update('email')} />
                                </div>
                                <div className="form__field d-flex flex-column gap-0-5">
                                    <label className="form__label" htmlFor="lp-message">How can we help?</label>
                                    <textarea id="lp-message" className="form__textarea" rows={4} value={form.message} onChange={update('message')} />
                                </div>
                                <div className="form__actions form__actions--stacked">
                                    <button type="submit" className="btn btn--primary btn--md">Get my free quote</button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </section>
    )
}

export default ContactForm
