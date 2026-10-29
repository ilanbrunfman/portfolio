import { Router } from 'express'
import { requireAuth } from './middleware/auth.js'
import authRouter from './routes/auth.js'
import accountsRouter from './routes/accounts.js'
import categoriesRouter from './routes/categories.js'
import transactionsRouter from './routes/transactions.js'
import transfersRouter from './routes/transfers.js'
import summaryRouter from './routes/summary.js'

// Every bank tracker route, as one router. app.js decides where it's mounted.
const bank = Router()

// Public: sign up, log in, log out, who am I
bank.use('/auth', authRouter)

// Logged-in users only (requireAuth sets req.user; routes only touch that user's data)
bank.use('/accounts', requireAuth, accountsRouter)
bank.use('/categories', requireAuth, categoriesRouter)
bank.use('/transactions', requireAuth, transactionsRouter)
bank.use('/transfers', requireAuth, transfersRouter)
bank.use('/summary', requireAuth, summaryRouter)

export default bank
