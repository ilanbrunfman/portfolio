// Deck helpers: turn the nested deck tree (see data/*.data.js) into the
// structures the shell needs. Pure functions — build once with useMemo.

/**
 * @typedef {Object} DeckSlide
 * @property {string} id
 * @property {string} title
 * @property {string} component   key into SLIDE_COMPONENTS
 * @property {string} [summary]   one-line blurb for overview tiles
 * @property {string} number      display number: '03', '03.1', …
 * @property {number} index       position in the swipe order
 * @property {string|null} parentId
 * @property {DeckSlide[]} children
 */

const pad = (n) => String(n).padStart(2, '0')

/**
 * Builds the deck model from the tree.
 *
 * - `slides`   flat preorder list (parent overview, then its children) — the swipe order
 * - `sections` top-level slides, each with resolved `children`
 * - `byId`     id → slide
 *
 * @param {Array<object>} tree
 * @returns {{ slides: DeckSlide[], sections: DeckSlide[], byId: Record<string, DeckSlide> }}
 */
export const buildDeck = (tree) => {
    const slides = []
    const byId = {}

    const walk = (nodes, parent) =>
        nodes.map((node, i) => {
            const slide = {
                id: node.id,
                title: node.title,
                component: node.component,
                summary: node.summary,
                number: parent ? `${parent.number}.${i + 1}` : pad(i + 1),
                index: slides.length,
                parentId: parent?.id ?? null,
                children: [],
            }
            slides.push(slide)
            byId[slide.id] = slide
            if (node.children?.length) slide.children = walk(node.children, slide)
            return slide
        })

    const sections = walk(tree, null)
    return { slides, sections, byId }
}

/**
 * Walks up to the top-level section a slide belongs to.
 * @param {DeckSlide} slide
 * @param {Record<string, DeckSlide>} byId
 * @returns {DeckSlide}
 */
export const sectionOf = (slide, byId) => {
    let node = slide
    while (node.parentId) node = byId[node.parentId]
    return node
}
