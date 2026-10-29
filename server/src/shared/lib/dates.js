// 'YYYY-MM-DD' → Date at midnight UTC (date columns are DATE, no time)
export const toDate = (day) => new Date(`${day}T00:00:00Z`)

// Date → 'YYYY-MM-DD'
export const toDay = (date) => date.toISOString().slice(0, 10)
