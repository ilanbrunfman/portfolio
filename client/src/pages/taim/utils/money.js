// Money helpers. The API stores and sends whole cents (1400 = $14.00);
// these convert for display and for form inputs. One currency for the app.
// (Same as the bank tracker's; each project keeps its own copy so they
// stay independent.)

export const CURRENCY = 'USD'

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY })

/** 1400 → "$14.00" */
export const formatMoney = (cents) => formatter.format(cents / 100)

/** 1400 → "14.00" (for prefilling an input) */
export const centsToInput = (cents) => (cents / 100).toFixed(2)

/**
 * What the user typed → cents, or null if it isn't a valid amount.
 * Accepts "14", "14.5", "$14.50".
 */
export const parseMoney = (text) => {
    const clean = String(text).trim().replace(/[\s,$]/g, '')
    if (!/^-?\d+(\.\d{1,2})?$/.test(clean)) return null
    return Math.round(Number(clean) * 100)
}
