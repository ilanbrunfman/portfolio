// Money helpers. The API stores and sends whole cents (1250 = $12.50);
// these convert for display and for form inputs. One currency for the app.

export const CURRENCY = 'USD'

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY })

/** 123456 → "$1,234.56", -500 → "-$5.00" */
export const formatMoney = (cents) => formatter.format(cents / 100)

/** 123456 → "1234.56" (for prefilling an input) */
export const centsToInput = (cents) => (cents / 100).toFixed(2)

/**
 * What the user typed → cents, or null if it isn't a valid amount.
 * Accepts "1234", "1,234.5", "$1,234.56", "-20".
 */
export const parseMoney = (text) => {
    const clean = String(text).trim().replace(/[\s,$]/g, '')
    if (!/^-?\d+(\.\d{1,2})?$/.test(clean)) return null
    return Math.round(Number(clean) * 100)
}
