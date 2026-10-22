import { useEffect, useState } from 'react'
import { api } from '@/pages/bank/api/client'

/**
 * Bank tracker – entry page (/bank).
 * For now it only checks that the Express API and its database are reachable.
 */
const BankApp = () => {
    const [health, setHealth] = useState({ state: 'loading' })

    useEffect(() => {
        let ignore = false // skip the update if the page unmounted first
        api('/health')
            .then((data) => !ignore && setHealth({ state: 'ok', time: data.time }))
            .catch((err) => !ignore && setHealth({ state: 'error', message: err.message }))
        return () => { ignore = true }
    }, [])

    return (
        <main className="container d-flex flex-column gap-1 py-4">
            <h1>Bank tracker</h1>
            {health.state === 'loading' && <p>Checking the API…</p>}
            {health.state === 'ok' && (
                <p>API and database connected · server time {new Date(health.time).toLocaleTimeString()}</p>
            )}
            {health.state === 'error' && (
                <p role="alert">
                    {health.message}.{' '}
                    {health.message === 'Database unreachable'
                        ? <>Start it with <code>docker compose up -d</code> in <code>server/</code>.</>
                        : <>Start the API with <code>npm run dev</code> in <code>server/</code>.</>}
                </p>
            )}
        </main>
    )
}

export default BankApp
