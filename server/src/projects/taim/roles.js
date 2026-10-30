// Who may do what in Ta'im – the "Roles and rights" grid from the plan, in
// one place. Routes ask for a right by name (allow('editMenu')), never for
// a list of roles, so changing a tick here changes it everywhere.

export const ROLES = ['MANAGER', 'CHEF', 'COOK', 'HOST', 'WAITER']

/** Right → the roles that have it */
export const RIGHTS = {
    editMenu: ['MANAGER', 'CHEF'], // add, edit, hide dishes and prices
    setUpTables: ['MANAGER'], // add, rename tables, set seats
    seatTable: ['MANAGER', 'HOST', 'WAITER'], // seat a table or start take-out; move or undo a seating
    cleanTable: ['MANAGER', 'HOST', 'WAITER'], // mark a table clean after guests leave
    combineTables: ['MANAGER', 'HOST'], // join free tables for a big party, split them again
    addDishes: ['MANAGER', 'WAITER'], // a table's order: add, send, move, remove dishes
    takeoutOrders: ['MANAGER', 'HOST', 'WAITER'], // the same on a take-out (the host takes phone orders)
    advanceDish: ['CHEF', 'COOK'], // start a ticket, preparing → served (the Manager only looks at the kitchen)
    fireHeld: ['CHEF'], // fire a table's held dishes from the kitchen, once its earlier dishes were served a while ago
    markCameBack: ['MANAGER', 'CHEF', 'WAITER'], // a dish came back, with a reason
    closeBill: ['MANAGER', 'HOST', 'WAITER'], // close the bill, free the table
    seeLosses: ['MANAGER', 'CHEF'], // the losses summary
    reviewBills: ['MANAGER', 'CHEF', 'HOST'], // every bill of the day, week, month or year, with totals
    closeDay: ['MANAGER', 'CHEF'], // end of the day: lock its bills and save the report
}

/** Screen → the roles that see it in the side nav */
export const SCREENS = {
    floor: ['MANAGER', 'CHEF', 'HOST', 'WAITER'], // the Chef only looks: no rights that change the floor
    order: ['MANAGER', 'HOST', 'WAITER'], // the Host uses it for take-outs (tables' bills read-only)
    kitchen: ['MANAGER', 'CHEF', 'COOK'], // the Manager only looks: no kitchen rights
    menu: ['MANAGER', 'CHEF'],
    bills: ['MANAGER', 'CHEF', 'HOST'], // review bills; Manager and Chef close the day
    losses: ['MANAGER', 'CHEF'],
}

const forRole = (map, role) => Object.keys(map).filter((key) => map[key].includes(role))

/** Everything the client needs to know about a role: its rights and screens */
export const permissionsFor = (role) => ({
    rights: forRole(RIGHTS, role),
    screens: forRole(SCREENS, role),
})
