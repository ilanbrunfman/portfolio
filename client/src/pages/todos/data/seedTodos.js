// Starter todos shown on a visitor's first load (before anything is saved),
// so the demo isn't empty. Once the list is saved, the visitor's own list wins.

const SEED = [
    { title: 'Review pull requests', description: 'Check the open PRs on the portfolio repo and leave feedback.', completed: true },
    { title: 'Update resume', description: 'Add the latest projects and refresh the skills section.', completed: false },
    { title: 'Write unit tests for the todo context', description: 'Cover add, update, delete, toggle and reorder.', completed: false },
    { title: 'Plan weekly grocery list', description: 'Vegetables, fruit, coffee, and snacks for the week.', completed: true },
    { title: 'Book dentist appointment', description: 'Six-month checkup. Mornings work best.', completed: false },
    { title: 'Refactor landing page sections', description: 'Pull shared pieces into reusable components.', completed: false },
    { title: 'Go for a 5k run', description: 'Easy pace around the park.', completed: true },
    { title: 'Read two chapters of a book', description: 'Pick up where I left off last week.', completed: false },
    { title: 'Back up laptop', description: 'Run a full backup to the external drive.', completed: false },
    { title: 'Call mom', description: '', completed: false },
]

const DAY = 24 * 60 * 60 * 1000

// Built at load time so the "Created" dates look recent: one per day, oldest first.
export const buildSeedTodos = () => {
    const now = Date.now()
    return SEED.map((todo, index) => ({
        id: `seed-${index + 1}`,
        ...todo,
        order: index,
        createdAt: new Date(now - (SEED.length - index) * DAY).toISOString(),
    }))
}
