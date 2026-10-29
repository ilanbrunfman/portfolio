// Ta'im's screens, in side-nav order. Which ones a person sees comes from
// the server (session.screens), so this only holds how each one looks.
// `step` = the build step that brings the real screen; `shortLabel` = the
// phone tab bar's text when the label is too long.
export const SCREENS = [
    { id: 'floor', label: 'Floor', icon: 'IconLayout', step: 4, about: 'Tables free or taken: seat guests, start take-out, close bills.' },
    { id: 'order', label: 'Order', icon: 'IconListBullets', step: 4, about: 'The menu by category: tap dishes to add them to a table\'s order.' },
    { id: 'kitchen', label: 'Kitchen', icon: 'IconStack', step: 5, about: 'Every dish waiting, oldest first: tap when it goes out.' },
    { id: 'menu', label: 'Menu', icon: 'IconList', step: 3, about: 'Categories and dishes: add, change prices, hide what\'s sold out.' },
    { id: 'losses', label: 'Losses', icon: 'IconTable', step: 6, about: 'Money lost to dishes that came back, month by month.' },
]

export const ROLE_LABELS = {
    MANAGER: 'Manager',
    CHEF: 'Chef',
    COOK: 'Cook',
    HOST: 'Host',
    WAITER: 'Waiter',
}
