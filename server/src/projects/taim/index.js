import { Router } from 'express'
import { requireStaff } from './middleware/staff.js'
import staffRouter from './routes/staff.js'
import sessionRouter from './routes/session.js'
import menuRouter from './routes/menu.js'
import floorRouter from './routes/floor.js'
import kitchenRouter from './routes/kitchen.js'
import billsRouter from './routes/bills.js'

// Every Ta'im route, as one router. app.js mounts it at /api/taim.
//
// Two checks protect each route (see middleware/staff.js):
//   requireStaff  – who are you? (401 if nobody was picked)
//   allow(right)  – may your role do this? (403 if not, rights in roles.js)
const taim = Router()

// Public: the people to pick from, and picking one
taim.use('/staff', staffRouter)
taim.use('/session', sessionRouter)

// Everything below needs a picked person (req.staff)
taim.use(requireStaff)

// /menu, /categories, /menu-items
taim.use(menuRouter)
// /tables, /orders
taim.use(floorRouter)
// /kitchen, /order-items/:id/serve|unserve
taim.use(kitchenRouter)
// /bills, /days/close
taim.use(billsRouter)

export default taim
