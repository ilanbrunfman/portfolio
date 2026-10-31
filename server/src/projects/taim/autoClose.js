import { autoCloseDay, DAY_ENDS_AT, TIME_ZONE } from './services/days.js'
import { applyDueVersion } from './services/menuVersions.js'

// Closes the business day by itself at the set time (TAIM_DAY_ENDS_AT,
// 04:00 restaurant time) when nobody closed it by hand. A timer in the API
// process checks every 15 minutes (and shortly after the server starts);
// while bills are still open it just tries again next time. If the server
// was off at 04:00, the first check after it starts closes the day.

const EVERY_MS = 15 * 60_000

async function check() {
    try {
        // A scheduled menu whose start has come becomes the menu in use
        if (await applyDueVersion()) console.log('[taim] A scheduled menu is now the menu in use')
        const outcome = await autoCloseDay()
        if (outcome.result === 'closed') {
            console.log(`[taim] Day closed automatically at ${DAY_ENDS_AT}: ${outcome.day.billCount} bills, ${outcome.day.sales} cents`)
        } else if (outcome.result === 'waiting') {
            console.log(`[taim] Day not closed yet: ${outcome.open} bills still open, trying again in 15 minutes`)
        }
    } catch (err) {
        console.error('[taim] Automatic day close failed:', err)
    }
}

/** Start the timer (src/index.js; not in tests). Returns a stop function. */
export function startAutoClose() {
    console.log(`[taim] Days close automatically at ${DAY_ENDS_AT} (${TIME_ZONE}) if nobody closed them`)
    const first = setTimeout(check, 10_000)
    const timer = setInterval(check, EVERY_MS)
    timer.unref()
    first.unref()
    return () => {
        clearTimeout(first)
        clearInterval(timer)
    }
}
