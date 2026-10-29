import { Router } from 'express'
import staffRouter from './routes/staff.js'
import sessionRouter from './routes/session.js'

// Every Ta'im route, as one router. app.js mounts it at /api/taim.
//
// Two checks protect each route (see middleware/staff.js):
//   requireStaff  – who are you? (401 if nobody was picked)
//   allow(right)  – may your role do this? (403 if not, rights in roles.js)
const taim = Router()

// Public: the people to pick from, and picking one
taim.use('/staff', staffRouter)
taim.use('/session', sessionRouter)

export default taim
