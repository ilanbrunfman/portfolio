// Who may do what in Ta'im – the "Roles and rights" grid from the plan, in
// one place. Routes ask for a right by name (allow('editMenu')), never for
// a list of roles, so changing a tick here changes it everywhere.

export const ROLES = ['MANAGER', 'CHEF', 'COOK', 'HOST', 'WAITER']

/** Right → the roles that have it */
export const RIGHTS = {
    editMenu: ['MANAGER', 'CHEF'], // add, edit, hide dishes and prices
    setUpTables: ['MANAGER'], // add, rename tables, set seats
    seatTable: ['MANAGER', 'HOST', 'WAITER'], // seat a table or start take-out
    addDishes: ['MANAGER', 'WAITER'], // add dishes to an order
    advanceDish: ['MANAGER', 'CHEF', 'COOK'], // preparing → sent out
    markCameBack: ['MANAGER', 'CHEF', 'WAITER'], // a dish came back, with a reason
    closeBill: ['MANAGER', 'HOST', 'WAITER'], // close the bill, free the table
    seeLosses: ['MANAGER', 'CHEF'], // the losses summary
}

/** Screen → the roles that see it in the side nav */
export const SCREENS = {
    floor: ['MANAGER', 'HOST', 'WAITER'],
    order: ['MANAGER', 'WAITER'],
    kitchen: ['MANAGER', 'CHEF', 'COOK'],
    menu: ['MANAGER', 'CHEF'],
    losses: ['MANAGER', 'CHEF'],
}

const forRole = (map, role) => Object.keys(map).filter((key) => map[key].includes(role))

/** Everything the client needs to know about a role: its rights and screens */
export const permissionsFor = (role) => ({
    rights: forRole(RIGHTS, role),
    screens: forRole(SCREENS, role),
})
