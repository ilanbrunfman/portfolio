/**
 * ARIA props a control needs to point at its Field's hint/error text.
 * @param {string} id
 * @param {{ hint?: React.ReactNode, error?: React.ReactNode }} messages
 */
export const fieldAria = (id, { hint, error }) => ({
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
})
